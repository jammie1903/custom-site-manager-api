import { ObjectId } from "bson"
import { Persisted } from "../types";

export interface IPage {
  projectId: ObjectId | string
  templateId?: ObjectId | string
  parentId?: ObjectId | string,
  nextSiblingId?: ObjectId | string
  name: string // stored to avoid compilation serverside
  fields: {[key: string]: FieldValue}
  layout: ILayoutItem[] | null
  customFields: IField[]
}

export interface IPageTree extends Persisted<{}> {
  name: string
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
