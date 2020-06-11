// Dependencies
import React, { FC, ReactElement, useState, useContext, memo } from 'react'
import { Alert, Badge, Input, TextArea, PrimaryButton, SuccessButton, Icon } from 'fogg-ui'
import { cx, slugFn, getEmptyValues, waitFor } from 'fogg-utils'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { useMutation } from '@apollo/react-hooks'

// Shared components
import MainLayout from '@layouts/main/MainLayout'
import Link from '@ui/Link'

// Contexts
import { FormContext } from '@contexts/form'

// Mutation
import CREATE_VALUES_MUTATION from '@graphql/values/createValues.mutation'
import FIND_UNIQUE_VALUES_MUTATION from '@graphql/values/findUniqueValues.mutation'

// Styles
import styles from './Create.scss'

interface iProps {
  router: any
  data: any
}

// Setting a unique ID
const newId = uuidv4()

const Create: FC<iProps> = ({ data }): ReactElement => {
  // Data
  const { getModel } = data

  // Fields
  const initialValues: any = {}
  const systemInitialValues: any = {}
  const requiredValues: any = {}
  const systemFields = getModel.fields.filter((field: any) => field.isSystem)
  const customFields = getModel.fields.filter((field: any) => !field.isSystem)
  const uniqueFields = getModel.fields.filter((field: any) => field.isUnique && !field.isSystem)

  systemFields.forEach((field: any) => {
    let value = field.defaultValue

    if (field.identifier === 'id') {
      value = newId
    }

    if (field.identifier === 'createdAt') {
      value = moment().format('MM/DD/YYYY hh:mm a')
    }

    if (field.identifier === 'updatedAt') {
      value = ''
    }

    systemInitialValues[field.identifier] = value
  })

  customFields.forEach((field: any) => {
    initialValues[field.identifier] = ''

    if (field.isRequired) {
      requiredValues[field.identifier] = false
    }
  })

  // States
  const [active, setActive] = useState('')
  const [alert, setAlert] = useState('')
  const [alertType, setAlertType] = useState('success')
  const [showAlert, setShowAlert] = useState(false)
  const [values, setValues] = useState(initialValues)
  const [systemValues, setSystemValues] = useState(systemInitialValues)
  const [required, setRequired] = useState(requiredValues)
  const [saveLoading, setSaveLoading] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)

  // Mutations
  const [createValuesMutation] = useMutation(CREATE_VALUES_MUTATION)
  const [findUniqueValuesMutation] = useMutation(FIND_UNIQUE_VALUES_MUTATION)

  // Contexts
  const { onChange, setValue } = useContext(FormContext)

  // Methods
  const handleActive = (field: string) => {
    setActive(field)
  }

  const _onChange = (e: any): any => {
    if (e.target.name === 'title') {
      if (Object.prototype.hasOwnProperty.call(initialValues, 'slug')) {
        setValue('slug', slugFn(e.target.value), setValues)
      }

      if (Object.prototype.hasOwnProperty.call(initialValues, 'identifier')) {
        setValue('identifier', slugFn(e.target.value), setValues)
      }
    }

    onChange(e, setValues)
  }

  const handleSubmit = async (action: string): Promise<void> => {
    const emptyValues = getEmptyValues(values, Object.keys(requiredValues))
    const entryValues: any[] = []

    if (emptyValues) {
      setRequired(emptyValues)
    } else {
      if (action === 'save') {
        setSaveLoading(true)
      } else {
        setPublishLoading(true)
      }

      const uniqueValues = uniqueFields.map((field: any) => ({ value: values[field.identifier] }))

      const { data: dataFindUniqueValues } = await findUniqueValuesMutation({
        variables: {
          input: uniqueValues
        }
      })

      waitFor(2).then(async () => {
        if (action === 'save') {
          setSaveLoading(false)
        } else {
          setPublishLoading(false)
        }

        if (dataFindUniqueValues.findUniqueValues.length > 0) {
          setAlert('This entry already exists')
          setShowAlert(true)
          setAlertType('danger')

          waitFor(2).then(() => {
            setShowAlert(false)
          })
        } else {
          // Setting up System Field values
          values.id = newId
          values.status = action === 'save' ? 'Draft' : 'Published'
          values.createdAt = moment().format()
          values.updatedAt = moment().format()

          Object.keys(values).forEach((fieldIdentifier: string) => {
            const valueField = getModel.fields.find(
              (field: any) => field.identifier === fieldIdentifier
            )

            entryValues.push({
              entry: newId,
              fieldId: valueField.id,
              value: values[fieldIdentifier]
            })
          })

          const { data: dataCreateValues } = await createValuesMutation({
            variables: {
              values: entryValues
            }
          })

          if (dataCreateValues) {
            setAlert(action === 'save' ? 'Saved' : 'Published')
            setShowAlert(true)
            setAlertType('success')
            setSystemValues({
              id: values.id,
              createdAt: values.createdAt,
              updatedAt: values.updatedAt,
              status: values.status
            })

            waitFor(2).then(() => {
              setShowAlert(false)
            })
          }
        }
      })
    }
  }

  return (
    <MainLayout title="Create new Entry" header content footer sidebar noWrapper>
      <div className={styles.create}>
        <div className={styles.fields}>
          <div className={styles.goBack}>
            <Link
              href={`/dashboard/${getModel.appId}/master/content/model/${getModel.identifier}`}
              title={`Go back to ${getModel.modelName}`}
            >
              <Icon type="fas fa-chevron-left" />
            </Link>
            &nbsp;&nbsp;&nbsp;
            <Badge className={styles.badge}>{getModel.modelName}</Badge>
            {values.title ? (
              <>{values.title || `Edit ${getModel.modelName}`}</>
            ) : (
              <>New {getModel.modelName}</>
            )}
          </div>

          {customFields.map((field: any) => (
            <div
              key={field.id}
              className={cx(
                styles.field,
                active === field.identifier ? styles.active : '',
                required[field.identifier] ? styles.red : ''
              )}
              onClick={(): void => handleActive(field.identifier)}
            >
              <div>
                <label>
                  {field.fieldName}{' '}
                  {field.isRequired && (
                    <span className={cx(styles.tag, required[field.identifier] ? styles.red : '')}>
                      Required
                    </span>
                  )}
                </label>
              </div>

              {field.type === 'String' && (
                <div className={styles[field.type.toLowerCase()]}>
                  <Input
                    type="text"
                    hasError={required[field.identifier]}
                    name={field.identifier}
                    onChange={_onChange}
                    placeholder={field.fieldName}
                    value={values[field.identifier]}
                  />
                </div>
              )}

              {field.type === 'Text' && (
                <div className={styles[field.type.toLowerCase()]}>
                  <TextArea
                    name={field.identifier}
                    hasError={required[field.identifier]}
                    placeholder={field.fieldName}
                    onChange={_onChange}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.wrapper}>
            <div className={styles.block}>Status</div>

            <div className={styles.row}>
              <PrimaryButton
                onClick={(): any => handleSubmit('save')}
                isLoading={saveLoading}
                disabled={publishLoading}
                loadingText="Saving..."
              >
                Save
              </PrimaryButton>
              <SuccessButton
                onClick={(): any => handleSubmit('publish')}
                isLoading={publishLoading}
                disabled={saveLoading}
                loadingText="Publishing..."
              >
                Publish
              </SuccessButton>
            </div>

            <div className={styles.block}>System Fields</div>

            <div className={styles.row}>
              <div className={styles.systemField}>
                <div>ID</div>
                <div className={styles.id}>{newId}</div>
              </div>

              {systemFields.map((systemField: any): any => {
                if (systemField.identifier !== 'id') {
                  return (
                    <div key={systemField.id} className={styles.systemField}>
                      <div>
                        {systemField.identifier === 'updatedAt'
                          ? 'Last saved'
                          : systemField.fieldName}
                      </div>
                      <div
                        className={cx(
                          styles[systemField.identifier],
                          styles[systemValues[systemField.identifier].toLowerCase()],
                          systemValues[systemField.identifier] === '' ? styles.empty : ''
                        )}
                      >
                        {systemValues[systemField.identifier]}
                      </div>
                    </div>
                  )
                }

                return <div key={systemField.id} />
              })}
            </div>
          </div>

          <div className={cx(styles.alert, showAlert ? styles.show : '')}>
            <Alert success={alertType === 'success'} danger={alertType === 'danger'} flat>
              {alert}
            </Alert>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default memo(Create)