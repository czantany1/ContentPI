export const STAGE_LINK = (u: any) => ({
  as: u ? `/dashboard/${u.appId}/${u.stage}` : '',
  href: '/dashboard/[appId]/[stage]'
})

export const CONTENT_LINK = (u: any) => ({
  as: u ? `${STAGE_LINK(u).as}/content/${u.section}/${u.model}` : '',
  href: `${STAGE_LINK(u).href}/[moduleName]/[section]/[model]`
})

export const CREATE_ENTRY_LINK = (u: any) => ({
  as: u ? `${STAGE_LINK(u).as}/create/${u.section}/${u.model}` : '',
  href: `${STAGE_LINK(u).href}/[moduleName]/[section]/[model]`
})

export const EDIT_ENTRY_LINK = (u: any) => ({
  as: u ? `${STAGE_LINK(u).as}/edit/${u.section}/${u.model}` : '',
  href: `${STAGE_LINK(u).href}/[moduleName]/[section]/[model]`
})

export const MODEL_LINK = (u: any) => ({
  as: u ? `${STAGE_LINK(u).as}/schema/model/${u.model}` : '',
  href: `${STAGE_LINK(u).href}/[moduleName]/[section]/[model]`
})

export const ENUMERATION_LINK = (u: any) => ({
  as: u ? `${STAGE_LINK(u).as}/schema/enumeration/${u.enumeration}` : '',
  href: `${STAGE_LINK(u).href}/[moduleName]/[section]/[model]`
})
