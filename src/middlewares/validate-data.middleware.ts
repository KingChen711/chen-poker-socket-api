import { Request, Response, NextFunction } from 'express'
import { AnyZodObject } from 'zod'

const validateData = (schema: AnyZodObject) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    })
    next()
  } catch (error) {
    return res.status(400).send(error)
  }
}

export { validateData }
