import { ObjectId } from "bson"
import { Persisted } from "../types";

export interface IPage {
  projectId: ObjectId
  templateId?: ObjectId
  parentId?: ObjectId
  title: string // stored to avoid compilation serverside
  fields: {[key: string]: FieldValue}
  layout: ILayoutItem[]
  customFields: IField[]
}

export interface IPageTree extends Persisted<{}> {
  title: string
  children: IPageTree[]
}

export type FieldValue = string | boolean | number | Date

export interface IField {
  name: string,
  type: string,
  required: boolean,
  defaultValue?: FieldValue
}

export interface ILayoutItem {
  type: string,
  properties: any
}
