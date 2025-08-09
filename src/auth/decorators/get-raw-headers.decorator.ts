import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const GetRowHeaders = createParamDecorator(
    (data, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const headers = req.rawHeaders;
        return headers
    }
); 
