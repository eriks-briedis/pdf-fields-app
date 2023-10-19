'use client'

import { useEffect, useMemo, useState } from "react"
import Pdf from "./pdf"

export interface FieldDef {
  id: string
  name: string
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  type: 'text' | 'signature' | 'radio'
}

interface FieldProps {
  field: FieldDef
  remove: (field: FieldDef) => void
  update: (field: FieldDef) => void
}

const Field = ({ field, update, remove }: FieldProps) => {
  const [name, setName] = useState<string>(field.name)

  useEffect(() => {
    if (field.name === name) {
      return
    }
    update({ ...field, name })
  }, [field, name, update])

  return (
    <div className="my-2">
      <input type="text" value={name} onChange={(v) => setName(v.target.value)} />
      <button onClick={() => remove(field)}>Remove</button>
    </div>
  )
}

export default function Home() {
  // function to generate a unique id
  const generateId = useMemo(() => () => {
    return Math.random().toString(36).substring(2, 9)
  }, [])

  const [fields, setFields] = useState<FieldDef[]>([])
  const [formattedFields, setFormattedFields] = useState<string>()
  const emptyField: FieldDef = {
    id: generateId(),
    name: '',
    pageIndex: 0,
    x: 50,
    y: 50,
    width: 100,
    height: 30,
    type: 'text',
  }

  useEffect(() => {
    const savedFields = localStorage.getItem('pdf-fields-app_fields')
    if (savedFields) {
      setFields(JSON.parse(savedFields))
    }
  }, [])

  useEffect(() => {
    if (fields.length) {
      console.log('fields', fields)
      localStorage.setItem('pdf-fields-app_fields', JSON.stringify(fields))
    }
    const formattedFields = fields.map(({ id, ...field }) => field)
    setFormattedFields(JSON.stringify(formattedFields, null, 2))
  }, [fields])

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5>Upload your PDF file</h5>
          <input type="file" accept="application/pdf" />
        </div>
        <div>
          <h5>Your fields</h5>

          {fields.map((field) => (
            <Field
              key={field.id}
              field={field} 
              update={(f) => setFields(fields.map((aField) => aField.id === f.id ? f : aField))}
              remove={(f) => setFields(fields.filter((f) => f.id !== field.id))} 
            />
          ))}

          {!!fields.every((f) => !!f.name) &&
            <button onClick={() => setFields([...fields, emptyField])}>Add field</button>
          }
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="preview">
          <h5>Preview</h5>
          <textarea value={formattedFields} readOnly={true} />
        </div>
        <Pdf fields={fields} fieldsUpdated={setFields} />
      </div>
    </div>
  )
}
