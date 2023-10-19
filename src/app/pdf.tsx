'use client'

// import { fabric } from 'fabric'
import { Document, Page } from 'react-pdf';
import { use, useEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import { fabric } from 'fabric';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import { FieldDef } from './page';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export interface PdfProps {
  fields: FieldDef[]
  fieldsUpdated: (fields: FieldDef[]) => void
}

export default function Pdf({ fields, fieldsUpdated }: PdfProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [width, setWidth] = useState<number>(500);
  const [height, setHeight] = useState<number>(500);
  const {editor, onReady} = useFabricJSEditor()

  useEffect(() => {
    if (!fields || !editor) {
      return
    }
    
    const canvas = editor.canvas
    canvas.clear()
    canvas.renderAll()

    fields.filter((f) => !f.width || f.height).forEach((field) => {
      const fieldRect = new fabric.Rect({
        left: field.x,
        top: field.y,
        fill: '',
        stroke: 'red',
        strokeWidth: 2,
        width: field.width,
        height: field.height,
        selectable: true,
      })

      let textEl: fabric.Text | undefined
      if (field.name) {
        textEl = new fabric.Text(field.name, {
          fontSize: 16,
          left: field.x,
          top: field.y,
        })

        canvas.add(textEl)
      }

      let timeout: any

      fieldRect.on('scaling', (e) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          const newWidth = (Math.round(fieldRect.getScaledWidth()))
          const newHeight = (Math.round(fieldRect.getScaledHeight()))

          fieldsUpdated(fields.map((aField) => {
            if (aField.id !== field.id) {
              return aField
            }

            return {
              ...aField,
              width: newWidth,
              height: newHeight,
            }
          }))
        }, 300)
      })
      
      fieldRect.on('moving', (e) => {
        if (textEl) {
          textEl.set({
            left: fieldRect.left ?? 0,
            top: fieldRect.top ?? 0,
          })
        }
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          fieldsUpdated(fields.map((aField) => {
            if (aField.id !== field.id) {
              return aField
            }

            return {
              ...aField,
              x: fieldRect.left ?? 0,
              y: fieldRect.top ?? 0,
            }
          }))
        }, 300)
      })

      canvas.add(fieldRect)
    })
  }, [fields])

  useEffect(() => {
    if (!editor) {
      return
    }

    editor.canvas.setWidth(width)
    editor.canvas.setHeight(height)
    editor.canvas.renderAll() 
  }, [editor, width, height])

  function onDocumentLoadSuccess(e: any): void {
    e.getPage(1).then((p: any) => {
      const viewport = p.getViewport({ scale: 1 })
      setWidth(viewport.width)
      setHeight(viewport.height)
    })
    setNumPages(e.numPages);
  }
  
  return (
    <div className="pdf-wrapper" style={{width: `${width}px`, height: `${height}px`}}>
      <FabricJSCanvas className="sample-canvas" onReady={onReady} />
      <Document file="form.pdf" onLoadSuccess={onDocumentLoadSuccess}>
        <Page pageNumber={pageNumber} />
      </Document>
      <p>
        Page {pageNumber} of {numPages}
      </p>
    </div>
  )
}
