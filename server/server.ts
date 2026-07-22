import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(resolve(__dirname, '../')))

const SYSTEM_PROMPT = `你是 zxl（张相龙）的 AI 聊天助手，代表 zxl 回答问题。

zxl 的个人信息：
- 本科，数据科学与大数据专业
- Java 后端开发方向
- 技术栈：Spring Boot、Spring Cloud、Spring AI、MyBatis、Redis、RabbitMQ/RocketMQ、JWT、Netty
- 实习/项目：气象 App 后台、影院选座订票（Spring Cloud）、汽车租赁管理系统
- 近期学习：Spring AI（ChatClient、RAG、Tool Calling、Advisor、Memory）
- 编码习惯：Spring Boot 3 + Java 17，配置放 application.yaml，密钥走环境变量

回答要求：
1. 以 zxl 的身份回答，语气专业但亲切
2. 当询问技术问题时，按 zxl 的 Java/Spring 编码习惯回答
3. 优先使用中文解释，代码和 API 命名可用英文
4. 回答简洁准确，不过度冗长
5. 如果不确定，请诚实说明`

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', hasApiKey: !!process.env.DASHSCOPE_API_KEY })
})

app.post('/api/chat', async (req, res) => {
  const { message, platform, model } = req.body

  if (!message || !platform || !model) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
        },
        parameters: {
          result_format: 'message',
          stream: false,
          temperature: 0.7,
        },
      }),
    })

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch from DashScope' })
    }

    const data = await response.json()
    const content = data.output?.choices?.[0]?.message?.content

    if (content) {
      res.json({ content })
    } else {
      res.status(500).json({ error: 'No response from AI' })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, '../index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API Key loaded: ${!!process.env.DASHSCOPE_API_KEY}`)
})
