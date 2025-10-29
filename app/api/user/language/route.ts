import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { language: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ language: user.language });
  } catch (error) {
    console.error("Error fetching user language:", error);
    return NextResponse.json({ error: "Failed to fetch language" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, language } = await req.json();

    if (!email || !language) {
      return NextResponse.json({ error: "Email and language required" }, { status: 400 });
    }

    // Validate language
    if (!['nl', 'fr', 'en'].includes(language)) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { language },
    });

    return NextResponse.json({ success: true, language: user.language });
  } catch (error) {
    console.error("Error updating user language:", error);
    return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
  }
}

