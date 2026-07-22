import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const MODELS = ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-flash']

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState('qwen-plus')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          platform: 'dashscope',
          model,
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const assistantMessageId = (Date.now() + 1).toString()
      setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const text = line.substring(5).trimStart()
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId ? { ...msg, content: msg.content + text } : msg
                )
              )
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '抱歉，出现了一些错误，请稍后再试。',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="w-full lg:w-80 bg-slate-900/80 backdrop-blur-lg border-r border-slate-700/50 p-6">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-white">张相龙</h1>
          <p className="text-blue-400 mt-1">Java 后端开发工程师</p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">技术栈</h3>
            <div className="flex flex-wrap gap-2">
              {['Spring Boot', 'Spring Cloud', 'Spring AI', 'MyBatis', 'Redis', 'RabbitMQ', 'JWT', 'Netty'].map(skill => (
                <span key={skill} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">项目经验</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                气象 App 后台开发
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                影院选座订票系统（Spring Cloud）
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                汽车租赁管理系统
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">模型设置</h3>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">DashScope 模型</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">聊天助手</h2>
              <p className="text-sm text-slate-400">与 zxl 的 AI 助手对话</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate-400">在线</span>
            </div>
          </div>
        </header>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-white">Z</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">欢迎与我对话</h3>
              <p className="text-slate-400 max-w-md">
                我是 zxl 的 AI 聊天助手，你可以询问关于 Java 后端开发、Spring 技术栈、项目经验等方面的问题。
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {['介绍一下你的技术栈', 'Spring AI 怎么用', '你的项目经验', 'Java 面试问题'].map(question => (
                  <button
                    key={question}
                    onClick={() => setInputValue(question)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex animate-fadeIn ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm'
                  } px-4 py-3 shadow-lg`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></span>
                  </div>
                  <span className="text-sm text-slate-400">思考中...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="bg-slate-900/80 backdrop-blur-lg border-t border-slate-700/50 px-6 py-4">
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的问题..."
              disabled={isLoading}
              className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-500 shadow-lg hover:shadow-blue-500/25"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  发送中
                </span>
              ) : (
                '发送'
              )}
            </button>
          </form>
        </footer>
      </main>
    </div>
  )
}

export default App
