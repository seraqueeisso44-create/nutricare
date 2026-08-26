import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F3D2E",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 30% 20%, rgba(201,151,90,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(201,151,90,0.1) 0%, transparent 50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#C9975A",
              letterSpacing: "-1px",
            }}
          >
            NutriCare
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255,255,255,0.7)",
              marginTop: "12px",
            }}
          >
            Nutrição & Bem-estar
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "24px",
              maxWidth: "600px",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Calculadora TACO · Prescrição Dietética · Prontuário de Pacientes
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
