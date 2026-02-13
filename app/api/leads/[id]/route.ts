import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 404 });
  }

  return NextResponse.json({ data });
}


export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin
    .from("leads")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
