import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pqulfhofluzayfhrasfx.supabase.co'
const supabaseKey = 'sb_publishable_DDA4xHzA5cstl4975Zf0yA_WOZFDhCg'

export const supabase = createClient(supabaseUrl, supabaseKey)