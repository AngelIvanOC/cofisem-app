import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dwozudsdprnlgimluzup.supabase.co";      // ← pega tu URL aquí
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3b3p1ZHNkcHJubGdpbWx1enVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzQxOTEsImV4cCI6MjA4ODk1MDE5MX0.XzRtgJdA5fjyoXh-SV3KMmfmwens-vCXMG8NR1hZzoE";                // ← pega tu key aquí

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

