import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import influencersRouter from "./influencers";
import brandsRouter from "./brands";
import campaignsRouter from "./campaigns";
import applicationsRouter from "./applications";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";
import aiRouter from "./ai";
import socialRouter from "./social";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(influencersRouter);
router.use(brandsRouter);
router.use(campaignsRouter);
router.use(applicationsRouter);
router.use(messagesRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);
router.use(aiRouter);
router.use(socialRouter);

export default router;
