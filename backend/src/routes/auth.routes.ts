import { Router } from 'express'
import { register, login, linkCouple } from '../controllers/auth.controller'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/link-couple', linkCouple)

export default router