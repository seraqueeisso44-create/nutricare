import type { MetadataRoute } from "next"

const BASE_URL = "https://nutricare-jet.vercel.app"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/calculadora`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/pacientes`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/migracao`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/politica-privacidade`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ]
}
