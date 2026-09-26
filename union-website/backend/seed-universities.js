/**
 * Seed Universities Script
 * Creates the universities table via SQL and populates it with all Algerian universities.
 * Run: node seed-universities.js
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const MIGRATION_SQL = `
-- Create universities table
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    wilaya VARCHAR(100) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_universities_wilaya ON universities (wilaya);
CREATE INDEX IF NOT EXISTS idx_universities_display_order ON universities (display_order);
CREATE INDEX IF NOT EXISTS idx_universities_is_active ON universities (is_active);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_universities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_universities_updated_at') THEN
        CREATE TRIGGER trigger_universities_updated_at
            BEFORE UPDATE ON universities
            FOR EACH ROW
            EXECUTE FUNCTION update_universities_updated_at();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'universities' AND policyname = 'Public read active universities') THEN
        CREATE POLICY "Public read active universities" ON universities FOR SELECT USING (is_active = TRUE);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'universities' AND policyname = 'Service role full access on universities') THEN
        CREATE POLICY "Service role full access on universities" ON universities FOR ALL USING (TRUE) WITH CHECK (TRUE);
    END IF;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
`;

const UNIVERSITIES = [
    { name_ar: 'جامعة أحمد دراية أدرار', wilaya: 'أدرار', website_url: 'https://www.univ-adrar.dz', display_order: 1 },
    { name_ar: 'جامعة حسيبة بن بوعلي الشلف', wilaya: 'الشلف', website_url: 'https://www.univ-chlef.dz', display_order: 1 },
    { name_ar: 'جامعة عمار ثليجي الأغواط', wilaya: 'الأغواط', website_url: 'https://www.lagh-univ.dz', display_order: 1 },
    { name_ar: 'جامعة العربي بن مهيدي أم البواقي', wilaya: 'أم البواقي', website_url: 'https://www.univ-oeb.dz', display_order: 1 },
    { name_ar: 'جامعة باتنة 1 الحاج لخضر', wilaya: 'باتنة', website_url: 'https://www.univ-batna.dz', display_order: 1 },
    { name_ar: 'جامعة باتنة 2 مصطفى بن بولعيد', wilaya: 'باتنة', website_url: 'https://www.univ-batna2.dz', display_order: 2 },
    { name_ar: 'جامعة عبد الرحمان ميرة بجاية', wilaya: 'بجاية', website_url: 'https://www.univ-bejaia.dz', display_order: 1 },
    { name_ar: 'جامعة محمد خيضر بسكرة', wilaya: 'بسكرة', website_url: 'https://www.univ-biskra.dz', display_order: 1 },
    { name_ar: 'جامعة طاهري محمد بشار', wilaya: 'بشار', website_url: 'https://www.univ-bechar.dz', display_order: 1 },
    { name_ar: 'جامعة البليدة 1 سعد دحلب', wilaya: 'البليدة', website_url: 'https://www.univ-blida.dz', display_order: 1 },
    { name_ar: 'جامعة البليدة 2 لونيسي علي', wilaya: 'البليدة', website_url: 'https://www.univ-blida2.dz', display_order: 2 },
    { name_ar: 'جامعة أكلي محند أولحاج البويرة', wilaya: 'البويرة', website_url: 'https://www.univ-bouira.dz', display_order: 1 },
    { name_ar: 'المركز الجامعي آمين العقال الحاج موسى أق أخموك تمنراست', wilaya: 'تمنراست', website_url: 'https://www.cu-tamanrasset.dz', display_order: 1 },
    { name_ar: 'جامعة العربي التبسي تبسة', wilaya: 'تبسة', website_url: 'https://www.univ-tebessa.dz', display_order: 1 },
    { name_ar: 'جامعة أبو بكر بلقايد تلمسان', wilaya: 'تلمسان', website_url: 'https://www.univ-tlemcen.dz', display_order: 1 },
    { name_ar: 'جامعة ابن خلدون تيارت', wilaya: 'تيارت', website_url: 'https://www.univ-tiaret.dz', display_order: 1 },
    { name_ar: 'جامعة مولود معمري تيزي وزو', wilaya: 'تيزي وزو', website_url: 'https://www.ummto.dz', display_order: 1 },
    { name_ar: 'جامعة الجزائر 1 بن يوسف بن خدة', wilaya: 'الجزائر', website_url: 'https://www.univ-alger.dz', display_order: 1 },
    { name_ar: 'جامعة الجزائر 2 أبو القاسم سعد الله', wilaya: 'الجزائر', website_url: 'https://www.univ-alger2.dz', display_order: 2 },
    { name_ar: 'جامعة الجزائر 3 إبراهيم سلطان شيبوط', wilaya: 'الجزائر', website_url: 'https://www.univ-alger3.dz', display_order: 3 },
    { name_ar: 'جامعة هواري بومدين للعلوم والتكنولوجيا', wilaya: 'الجزائر', website_url: 'https://www.usthb.dz', display_order: 4 },
    { name_ar: 'المدرسة الوطنية المتعددة التقنيات', wilaya: 'الجزائر', website_url: 'https://www.enp.edu.dz', display_order: 5 },
    { name_ar: 'المدرسة الوطنية العليا للإعلام الآلي', wilaya: 'الجزائر', website_url: 'https://www.esi.dz', display_order: 6 },
    { name_ar: 'المدرسة العليا للأساتذة بالقبة', wilaya: 'الجزائر', website_url: 'https://www.ens-kouba.dz', display_order: 7 },
    { name_ar: 'المدرسة العليا للأساتذة ببوزريعة', wilaya: 'الجزائر', website_url: 'https://ensb.dz', display_order: 8 },
    { name_ar: 'المدرسة الوطنية العليا للفلاحة', wilaya: 'الجزائر', website_url: 'https://www.ensa.dz', display_order: 9 },
    { name_ar: 'المدرسة الوطنية العليا للبيطرة', wilaya: 'الجزائر', website_url: 'https://www.ensv.dz', display_order: 10 },
    { name_ar: 'المدرسة العليا للتجارة', wilaya: 'الجزائر', website_url: 'https://www.esc-alger.dz', display_order: 11 },
    { name_ar: 'جامعة زيان عاشور الجلفة', wilaya: 'الجلفة', website_url: 'https://www.univ-djelfa.dz', display_order: 1 },
    { name_ar: 'جامعة محمد الصديق بن يحيى جيجل', wilaya: 'جيجل', website_url: 'https://www.univ-jijel.dz', display_order: 1 },
    { name_ar: 'جامعة سطيف 1 فرحات عباس', wilaya: 'سطيف', website_url: 'https://www.univ-setif.dz', display_order: 1 },
    { name_ar: 'جامعة سطيف 2 محمد لمين دباغين', wilaya: 'سطيف', website_url: 'https://www.univ-setif2.dz', display_order: 2 },
    { name_ar: 'جامعة الدكتور مولاي الطاهر سعيدة', wilaya: 'سعيدة', website_url: 'https://www.univ-saida.dz', display_order: 1 },
    { name_ar: 'جامعة 20 أوت 1955 سكيكدة', wilaya: 'سكيكدة', website_url: 'https://www.univ-skikda.dz', display_order: 1 },
    { name_ar: 'جامعة جيلالي ليابس سيدي بلعباس', wilaya: 'سيدي بلعباس', website_url: 'https://www.univ-sba.dz', display_order: 1 },
    { name_ar: 'جامعة باجي مختار عنابة', wilaya: 'عنابة', website_url: 'https://www.univ-annaba.dz', display_order: 1 },
    { name_ar: 'جامعة 8 ماي 1945 قالمة', wilaya: 'قالمة', website_url: 'https://www.univ-guelma.dz', display_order: 1 },
    { name_ar: 'جامعة قسنطينة 1 الإخوة منتوري', wilaya: 'قسنطينة', website_url: 'https://www.umc.edu.dz', display_order: 1 },
    { name_ar: 'جامعة قسنطينة 2 عبد الحميد مهري', wilaya: 'قسنطينة', website_url: 'https://www.univ-constantine2.dz', display_order: 2 },
    { name_ar: 'جامعة قسنطينة 3 صالح بوبنيدر', wilaya: 'قسنطينة', website_url: 'https://www.univ-constantine3.dz', display_order: 3 },
    { name_ar: 'المدرسة العليا للأساتذة بقسنطينة', wilaya: 'قسنطينة', website_url: 'https://www.ens-constantine.dz', display_order: 4 },
    { name_ar: 'جامعة يحيى فارس المدية', wilaya: 'المدية', website_url: 'https://www.univ-medea.dz', display_order: 1 },
    { name_ar: 'جامعة عبد الحميد بن باديس مستغانم', wilaya: 'مستغانم', website_url: 'https://www.univ-mosta.dz', display_order: 1 },
    { name_ar: 'جامعة محمد بوضياف المسيلة', wilaya: 'المسيلة', website_url: 'https://www.univ-msila.dz', display_order: 1 },
    { name_ar: 'جامعة مصطفى اسطمبولي معسكر', wilaya: 'معسكر', website_url: 'https://www.univ-mascara.dz', display_order: 1 },
    { name_ar: 'جامعة قاصدي مرباح ورقلة', wilaya: 'ورقلة', website_url: 'https://www.univ-ouargla.dz', display_order: 1 },
    { name_ar: 'جامعة وهران 1 أحمد بن بلة', wilaya: 'وهران', website_url: 'https://www.univ-oran1.dz', display_order: 1 },
    { name_ar: 'جامعة وهران 2 محمد بن أحمد', wilaya: 'وهران', website_url: 'https://www.univ-oran2.dz', display_order: 2 },
    { name_ar: 'جامعة العلوم والتكنولوجيا محمد بوضياف وهران', wilaya: 'وهران', website_url: 'https://www.univ-usto.dz', display_order: 3 },
    { name_ar: 'المدرسة العليا للأساتذة بوهران', wilaya: 'وهران', website_url: 'https://www.ens-oran.dz', display_order: 4 },
    { name_ar: 'المركز الجامعي نور البشير البيض', wilaya: 'البيض', website_url: 'https://cu-elbayadh.dz', display_order: 1 },
    { name_ar: 'المركز الجامعي إليزي', wilaya: 'إليزي', website_url: '', display_order: 1 },
    { name_ar: 'جامعة محمد البشير الإبراهيمي برج بوعريريج', wilaya: 'برج بوعريريج', website_url: 'https://www.univ-bba.dz', display_order: 1 },
    { name_ar: 'جامعة أمحمد بوقرة بومرداس', wilaya: 'بومرداس', website_url: 'https://www.univ-boumerdes.dz', display_order: 1 },
    { name_ar: 'جامعة الشاذلي بن جديد الطارف', wilaya: 'الطارف', website_url: 'https://www.univ-eltarf.dz', display_order: 1 },
    { name_ar: 'جامعة تندوف', wilaya: 'تندوف', website_url: 'https://www.univ-tindouf.dz', display_order: 1 },
    { name_ar: 'المركز الجامعي أحمد بن يحيى الونشريسي تيسمسيلت', wilaya: 'تيسمسيلت', website_url: 'https://www.cuniv-tissemsilt.dz', display_order: 1 },
    { name_ar: 'جامعة حمه لخضر الوادي', wilaya: 'الوادي', website_url: 'https://www.univ-eloued.dz', display_order: 1 },
    { name_ar: 'جامعة عباس لغرور خنشلة', wilaya: 'خنشلة', website_url: 'https://www.univ-khenchela.dz', display_order: 1 },
    { name_ar: 'جامعة محمد الشريف مساعدية سوق أهراس', wilaya: 'سوق أهراس', website_url: 'https://www.univ-soukahras.dz', display_order: 1 },
    { name_ar: 'جامعة تيبازة', wilaya: 'تيبازة', website_url: 'https://www.univ-tipaza.dz', display_order: 1 },
    { name_ar: 'جامعة عبد الحفيظ بوالصوف ميلة', wilaya: 'ميلة', website_url: 'https://www.univ-mila.dz', display_order: 1 },
    { name_ar: 'جامعة الجيلالي بونعامة خميس مليانة', wilaya: 'عين الدفلى', website_url: 'https://www.univ-dbkm.dz', display_order: 1 },
    { name_ar: 'المركز الجامعي صالحي أحمد النعامة', wilaya: 'النعامة', website_url: 'https://www.cu-naama.dz', display_order: 1 },
    { name_ar: 'جامعة بلحاج بوشعيب عين تموشنت', wilaya: 'عين تموشنت', website_url: 'https://www.univ-temouchent.edu.dz', display_order: 1 },
    { name_ar: 'جامعة غرداية', wilaya: 'غرداية', website_url: 'https://www.univ-ghardaia.edu.dz', display_order: 1 },
    { name_ar: 'جامعة أحمد زبانة غليزان', wilaya: 'غليزان', website_url: 'https://www.univ-relizane.dz', display_order: 1 },
    { name_ar: 'المركز الجامعي تيميمون', wilaya: 'تيميمون', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي برج باجي مختار', wilaya: 'برج باجي مختار', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي أولاد جلال', wilaya: 'أولاد جلال', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي بني عباس', wilaya: 'بني عباس', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي عين صالح', wilaya: 'عين صالح', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي عين قزام', wilaya: 'عين قزام', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي توقرت', wilaya: 'توقرت', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي جانت', wilaya: 'جانت', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي المغير', wilaya: 'المغير', website_url: '', display_order: 1 },
    { name_ar: 'المركز الجامعي المنيعة', wilaya: 'المنيعة', website_url: '', display_order: 1 },
];

async function supabaseSQL(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql })
    });
    return response;
}

async function main() {
    console.log('=== Universities Seed Script ===\n');

    // Step 1: Run migration SQL via Supabase SQL endpoint
    console.log('1. Creating universities table...');

    const sqlResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: MIGRATION_SQL })
    });

    if (!sqlResponse.ok) {
        // Try the alternative SQL endpoint
        console.log('   Direct SQL endpoint not available, trying alternative...');

        // Use the Supabase Management API
        const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
        const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ query: MIGRATION_SQL })
        });

        if (!mgmtResponse.ok) {
            console.log('   Could not execute SQL via API. The table must be created via Supabase SQL Editor.');
            console.log('   Checking if table already exists via REST API...');
        }
    } else {
        console.log('   Table created successfully!');
    }

    // Step 2: Wait for schema cache to update
    console.log('\n2. Waiting for schema cache reload...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Check if table is accessible via REST
    console.log('\n3. Checking table access...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: checkData, error: checkError } = await supabase
        .from('universities')
        .select('id')
        .limit(1);

    if (checkError) {
        console.error('   ERROR: Table not accessible via REST API.');
        console.error('   Error:', checkError.message);
        console.log('\n   ========================================');
        console.log('   ACTION REQUIRED:');
        console.log('   ========================================');
        console.log('   Go to Supabase Dashboard > SQL Editor and run:');
        console.log('');
        console.log(MIGRATION_SQL);
        console.log('');
        console.log('   Then re-run this script: node seed-universities.js');
        console.log('   ========================================');
        process.exit(1);
    }

    console.log('   Table is accessible!');

    // Step 4: Check existing data
    const { data: existing } = await supabase
        .from('universities')
        .select('name_ar');

    const existingNames = new Set((existing || []).map(u => u.name_ar));
    console.log(`   Existing records: ${existingNames.size}`);

    // Step 5: Insert missing universities
    const toInsert = UNIVERSITIES.filter(u => !existingNames.has(u.name_ar));
    console.log(`   New records to insert: ${toInsert.length}`);

    if (toInsert.length > 0) {
        console.log('\n4. Inserting universities...');
        const batchSize = 20;
        let inserted = 0;

        for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            const { error } = await supabase.from('universities').insert(batch);
            if (error) {
                console.error(`   Batch error:`, error.message);
            } else {
                inserted += batch.length;
                console.log(`   Inserted ${inserted}/${toInsert.length}...`);
            }
        }
    } else {
        console.log('\n4. All universities already exist, skipping insert.');
    }

    // Step 6: Verify
    console.log('\n5. Verifying...');
    const { data: allData, error: allError } = await supabase
        .from('universities')
        .select('*')
        .eq('is_active', true)
        .order('wilaya', { ascending: true })
        .order('display_order', { ascending: true });

    if (allError) {
        console.error('   Verification FAILED:', allError.message);
        process.exit(1);
    }

    console.log(`   Total active universities: ${allData.length}`);

    // Group by wilaya
    const wilayas = {};
    allData.forEach(u => {
        if (!wilayas[u.wilaya]) wilayas[u.wilaya] = 0;
        wilayas[u.wilaya]++;
    });

    console.log(`   Wilayas covered: ${Object.keys(wilayas).length}`);
    console.log('\n   Breakdown by wilaya:');
    Object.entries(wilayas).forEach(([w, c]) => {
        console.log(`     ${w}: ${c} institution(s)`);
    });

    // Step 7: Test the public API endpoint format
    console.log('\n6. Testing API response format...');
    const sample = allData.slice(0, 3);
    sample.forEach(u => {
        console.log(`   ✓ ${u.name_ar} (${u.wilaya}) - ${u.website_url || 'no website'}`);
    });

    console.log('\n=== DONE! Universities are ready. ===');
    console.log(`=== ${allData.length} universities across ${Object.keys(wilayas).length} wilayas ===`);
    console.log('\nRestart your server and visit /universities to see them.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
