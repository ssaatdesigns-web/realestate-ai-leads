import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(_req: Request, context: any) {
  const id = context?.params?.id as string;

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, context: any) {
  const id = context?.params?.id as string;

  const { error } = await supabaseAdmin.from("leads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
