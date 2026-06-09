import { PropsWithChildren } from 'react'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
import '@nutui/nutui-react-taro/dist/es/packages/popup/style/css'
import './app.scss'

function App({ children }: PropsWithChildren) {
  return children
}

export default App
