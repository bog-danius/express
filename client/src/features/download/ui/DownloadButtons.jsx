import React from 'react'
import { Button } from '../../../shared/ui/Button'
import { downloadApi } from '../api/downloadApi'

export default function DownloadButtons(){
  return (
    <div style={{marginTop:20}}>
      <h3>Скачать результаты</h3>
      <Button onClick={()=>downloadApi.download('json')}>JSON</Button>
      <Button onClick={()=>downloadApi.download('xml')}>XML</Button>
      <Button onClick={()=>downloadApi.download('html')}>HTML</Button>
    </div>
  )
}
