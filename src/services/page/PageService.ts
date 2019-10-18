import { ObjectId } from 'bson'
import { Service, Autowired } from 'express-utils'
import { NotFound } from 'http-errors'
import { IPage, IPageTree } from '../../interfaces'
import { Persisted, ValidatorRules, ValidatorResult } from '../../types'
import { IMongoService } from '../mongo/IMongoService'
import { isString, isGuid, ValidationError, Validator, isProject, isPage, isFieldArray, PageValidator, isPrimitiveDictionary } from '../../utils/Validation'
import { IPageService } from './IPageService'
import { IProjectService } from '../project/IProjectService'
import linkedListSort from '../../utils/linkedListSort'
import { asString, equals, asObjectId } from '../../utils/objectIdUtils';
import { Db } from 'mongodb';

@Service('pageService')
export default class PageService implements IPageService {
  @Autowired()
  private mongoService: IMongoService

  @Autowired()
  private projectService: IProjectService

  async getPage(userId: ObjectId, pageId: string): Promise<Persisted<IPage>> {
    const errors = await Validator.create(isGuid('pageId')).validate({pageId})
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }
    
    return this.mongoService.run(async db => {
      const page = await this.mongoService.get<IPage>(db, 'pages', {
        _id: ObjectId.createFromHexString(pageId)
      })

      try {
        const project = await this.projectService.getProject(userId, asString(page.projectId))
        if(!project.userId.equals(userId)) {
          throw new NotFound('page could not be found')
        }
      } catch(e) {
        throw new NotFound('page could not be found')
      }

      return page
    })
  }

  async getProjectPageTree(userId: ObjectId, projectId: string): Promise<IPageTree[]> {
    const errors = await Validator.create(isGuid('projectId')).validate({projectId})
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    const project = await this.projectService.getProject(userId, projectId)

    return this.mongoService.run(async db => {
      const pages = await this.mongoService.getAll<IPage>(db, 'pages', {
        projectId: project.id
      }, ['parentId', 'name'])
      if(pages.length === 0) {
        const rootPage = await this.createRootPage(project.id)
        pages.push(rootPage)
      }
      return this.toTree(pages)
    })
  }

  private toTree(pages: Persisted<IPage>[]): IPageTree[] {
    const returnList: IPageTree[] = []

    const treeItems = pages.map(page => ({
      id: page.id,
      next: page.nextSiblingId,
      name: page.name,
      children: []
    }))

    const map = treeItems.reduce((acc, t) => {
      acc[t.id.toHexString()] = t
      return acc
    }, {} as {[key: string]: IPageTree})

    pages.forEach(page => {
      const parent = page.parentId && map[asString(page.parentId)]
      const treeItem = map[page.id.toHexString()]
      if(parent) {
        parent.children.push(treeItem)
      } else {
        returnList.push(treeItem)
      }
    })
    
    treeItems.forEach(treeItem => {
      treeItem.children = linkedListSort(treeItem.children)
    })

    treeItems.forEach(treeItem => {
      delete treeItem.next
    })

    return returnList;
  }

  private getValidator(userId: ObjectId, forUpdate = false) : ValidatorRules<Persisted<IPage>> | ValidatorRules<IPage> {
    const val : ValidatorRules<Persisted<IPage>> = {
      ...(forUpdate ? isPage('id', userId, this) : {}),
      ...isString('name'),
      ...(!forUpdate ? isProject('projectId', userId, this.projectService) : {}),
      ...isPage('parentId', userId, this),
      ...isPage('nextSiblingId', userId, this, true),
      ...isPrimitiveDictionary('fields'),
      ...isFieldArray('customFields')
    }
    return val
  }

  private validateLinkedPages(pageValidator: ValidatorRules<IPage>, errors: ValidatorResult<IPage>, page: IPage) {
    if(!errors.parentId && !errors.projectId) {
      const parentPage = (pageValidator.parentId as PageValidator).page
      if(!equals(parentPage.projectId, page.projectId)) {
        errors.parentId = 'parentId must belong to the same project'
      }

      if(!errors.nextSiblingId) {
        const previousSiblingPage = (pageValidator.nextSiblingId as PageValidator).page
        if(previousSiblingPage) {
          if(!equals(previousSiblingPage.projectId, page.projectId)) {
            errors.nextSiblingId = 'nextSiblingId must belong to the same project'
          } else if(!equals(previousSiblingPage.parentId, parentPage.id)) {
            errors.nextSiblingId = 'nextSiblingId must have the same parent page'
          } 
        }
      }
    }
  }

  createRootPage(projectId: ObjectId): any {
    return this.mongoService.run(db => this.mongoService.insert<IPage>(db, 'pages', {
      customFields: [],
      fields: {
        'Name': 'Home',
        'Title': '{{Name}}',
        "Url": '/'
      },
      layout: [],
      parentId: null,
      projectId: projectId,
      //templateId: page.templateId, disabled until templates exist
      name: 'Home'
    }))
  }

  async create(userId: ObjectId, page: IPage): Promise<Persisted<IPage>> {
    const pageValidator = this.getValidator(userId)
    
    const errors = await Validator.create(pageValidator).validate(page)
    this.validateLinkedPages(pageValidator, errors, page)

    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    return this.mongoService.run(async db => {
      const newPage = await this.mongoService.insert<IPage>(db, 'pages', {
        customFields: page.customFields,
        fields: page.fields,
        layout: page.layout,
        parentId: asObjectId(page.parentId),
        projectId: asObjectId(page.projectId),
        nextSiblingId: asObjectId(page.nextSiblingId),
        //templateId: asObjectId(page.templateId), disabled until templates exist
        name: page.name
      })

      await this.updateSiblingLinks(db, newPage.id, asObjectId(page.parentId), asObjectId(page.nextSiblingId))

      return newPage
    })
  }

  async updateSiblingLinks(db: Db, id: ObjectId, parentId: ObjectId, siblingId: ObjectId, oldSiblingId?: ObjectId) {
    await this.mongoService.updateWhere<IPage>(db, 'pages', {
      nextSiblingId: siblingId,
      parentId,
      id: {$ne: id}
    }, {nextSiblingId: id})

    if(typeof oldSiblingId !== 'undefined') {
      await this.mongoService.updateWhere<IPage>(db, 'pages', {
        nextSiblingId: id,
        parentId
      }, {nextSiblingId: oldSiblingId})
    }
  }

  async update(userId: ObjectId, page: Persisted<IPage>): Promise<Persisted<IPage>> {
    const pageValidator: ValidatorRules<Persisted<IPage>> = this.getValidator(userId, true)
    
    const errors = await Validator.create(pageValidator).validate(page)
    this.validateLinkedPages(pageValidator, errors, page)
    
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }
    
    const existingPage: Persisted<IPage> = (pageValidator.id as PageValidator).page
    
    return this.mongoService.run(async db => {
      const oldSiblingId = existingPage.nextSiblingId
      const updatedPage = await this.mongoService.insert<IPage>(db, 'pages', {
        customFields: page.customFields,
        fields: page.fields,
        layout: page.layout,
        parentId: asObjectId(page.parentId),
        projectId: asObjectId(existingPage.projectId),
        nextSiblingId: asObjectId(page.nextSiblingId),
        // templateId: page.templateId, disabled until tempates exist
        name: page.name
      })

      if(!equals(oldSiblingId, page.nextSiblingId)) {
        await this.updateSiblingLinks(db, updatedPage.id, asObjectId(page.parentId), asObjectId(page.nextSiblingId))
      }

      return updatedPage
    })
  }
}
