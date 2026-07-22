import { VercelRequest, VercelResponse } from '@vercel/node'

interface ChatRequest {
  message: string
  platform: 'deepseek' | 'dashscope'
  model: string
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body: ChatRequest = req.body as ChatRequest

    if (!body.message || !body.platform || !body.model) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const apiKey = process.env.DASHSCOPE_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        input: {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: body.message },
          ],
        },
        parameters: {
          result_format: 'message',
          stream: true,
          temperature: 0.7,
        },
      }),
    })

    if (!response.ok || !response.body) {
      return res.status(500).json({ error: 'Failed to fetch from DashScope' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6).trim()
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const content = json.output?.choices?.[0]?.message?.content
            if (content) {
              res.write(`data: ${content}\n\n`)
            }
          } catch {
            continue
          }
        }
      }
    }

    res.end()
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
