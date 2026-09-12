import { z } from "zod";
export const interests = [
  "Cultura",
  "Arte",
  "Tecnología",
  "Naturaleza",
] as const;
export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(70),
    interests: z
      .array(z.enum(interests))
      .min(1)
      .max(4)
      .refine((a) => new Set(a).size === a.length),
    visible: z.boolean(),
    phone: z
      .string()
      .trim()
      .max(32)
      .regex(/^[+\d\s().-]*$/),
    city: z.string().trim().max(80),
    role: z.string().trim().max(100),
    bio: z.string().trim().max(500),
    contactConsent: z.boolean(),
    consent: z.literal(true),
  })
  .strict();
export type ProfileInput = z.infer<typeof profileSchema>;
export type OwnProfile = Omit<ProfileInput, "consent"> & { email: string };
export const publicMemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  interests: z.array(z.enum(interests)),
});
export type PublicMember = z.infer<typeof publicMemberSchema>;
// Explicit allowlist: private fields never travel to public clients.
export function publicMember(row: unknown): PublicMember {
  return publicMemberSchema.parse(row);
}
export type AdminMember = OwnProfile & {
  id: string;
  updatedAt: string;
  consentAt: string;
};
