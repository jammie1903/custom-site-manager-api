import { ObjectId } from 'bson'
import { Service, Autowired } from 'express-utils'
import { BadRequest, NotFound } from "http-errors"
import { Db } from 'mongodb'
import { IProject, IUser, IPage, IPageTree } from '../../interfaces'
import { Persisted, ValidatorRules } from '../../types'
import { IMongoService } from '../mongo/IMongoService'
import { isString, isGuid, ValidationError, Validator, isProject, isPage, isFieldArray, PageValidator, isPrimitiveDictionary } from '../../utils/Validation'
import { IPageService } from './IPageService';
import { IProjectService } from '../project/IProjectService';

const pageValidator: ValidatorRules<IPage> = {
  ...isGuid('projectId'),
}

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
        const project = await this.projectService.getProject(userId, page.projectId.toHexString())
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
      }, ['parentId', 'title'])
      return this.toTree(pages)
    })

  }

  private toTree(pages: Persisted<IPage>[]): IPageTree[] {
    const returnList: IPageTree[] = []

    const treeItems = pages.map(page => ({
      id: page.id,
      title: page.title,
      children: []
    }))

    const map = treeItems.reduce((acc, t) => {
      acc[t.id.toHexString()] = t
      return acc
    }, {} as {[key: string]: IPageTree})

    pages.forEach(page => {
      const parent = map[page.parentId.toHexString()]
      const treeItem = map[page.id.toHexString()]
      if(parent) {
        parent.children.push(treeItem)
      } else {
        returnList.push(treeItem)
      }
    })
    //TODO sorting

    return returnList;
  }

  private getValidator(userId: ObjectId, forUpdate = false) : ValidatorRules<Persisted<IPage>> | ValidatorRules<IPage> {
    const val : ValidatorRules<Persisted<IPage>> = {
      ...(forUpdate ? isPage('id', userId, this) : {}),
      ...isString('title'),
      ...(!forUpdate ? isProject('projectId', userId, this.projectService) : {}),
      ...isPage('parentId', userId, this, true),
      ...isPrimitiveDictionary('fields'),
      ...isFieldArray('customFields')
    }
    return val
  }

  async create(userId: ObjectId, page: IPage): Promise<Persisted<IPage>> {
    const pageValidator = this.getValidator(userId)
    
    const errors = await Validator.create(pageValidator).validate(page)

    if(!errors.parentId && !errors.projectId) {
      const parentPage = (pageValidator.parentId as PageValidator).page
      if(parentPage && !parentPage.projectId.equals(page.projectId)) {
        errors.parentId = 'parentId must belong to the same project'
      }
    }

    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    return this.mongoService.run(async db => {
      const newPage = await this.mongoService.insert<IPage>(db, 'pages', {
        customFields: page.customFields,
        fields: page.fields,
        layout: page.layout,
        parentId: page.parentId,
        projectId: page.projectId,
        templateId: page.templateId,
        title: page.title
      })

      return newPage
    })
  }

  async update(userId: ObjectId, page: Persisted<IPage>): Promise<Persisted<IPage>> {
    const pageValidator: ValidatorRules<Persisted<IPage>> = this.getValidator(userId, true)
    
    const errors = await Validator.create(pageValidator).validate(page)
    const existingPage: Persisted<IPage> = (pageValidator.id as PageValidator).page

    if(!errors.parentId && existingPage) {
      const parentPage = (pageValidator.parentId as PageValidator).page
      if(parentPage && !parentPage.projectId.equals(existingPage.projectId)) {
        errors.parentId = 'parentId must belong to the same project'
      }
    }

    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    return this.mongoService.run(async db => {
      const newPage = await this.mongoService.insert<IPage>(db, 'pages', {
        customFields: page.customFields,
        fields: page.fields,
        layout: page.layout,
        parentId: page.parentId,
        projectId: existingPage.projectId,
        templateId: page.templateId,
        title: page.title
      })

      return newPage
    })
  }
}
