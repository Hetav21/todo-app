import express, {ErrorRequestHandler, NextFunction, Request, Response} from "express";
import bodyParser from "body-parser";
import adminRouter from "./routes/admin";
import userRouter from "./routes/user";

const app = express()
const port = 3000

app.use(bodyParser.json());

app.use("/admin", adminRouter);
app.use("/user", userRouter);

// Global Catch:
app.use(function(err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction): void{
    res.status(404).json({
        msg: 'Internal Server Error'
    })
});

app.listen(port)