import z from "zod";

const adminSchema = z.object({
    name: z.string(),
    username: z.string(),
    email: z.string().email(),
    password: z.string().min(8)
});

export = adminSchema;