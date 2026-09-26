/**
 * Database Configuration - Supabase (PostgreSQL)
 * Arabic (ar) content architecture
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

let supabase = null;

/**
 * Build a direct PostgreSQL connection string from env vars.
 * Accepts SUPABASE_DB_URL directly, or builds one from SUPABASE_URL + SUPABASE_DB_PASSWORD.
 */
function getDatabaseUrl() {
    if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

    const dbPassword = process.env.SUPABASE_DB_PASSWORD;
    if (!dbPassword) return null;

    const projectRef = (process.env.SUPABASE_URL || '').replace('https://', '').replace('.supabase.co', '');
    if (!projectRef) return null;

    return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
}

/**
 * Run raw SQL against the database directly (bypasses PostgREST).
 * Returns { rows } on success, throws on failure.
 */
async function runDirectSQL(sql, params) {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) return null;

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
        const result = await pool.query(sql, params);
        return result;
    } finally {
        await pool.end();
    }
}

/**
 * Create the universities table via direct SQL if it doesn't exist,
 * then notify PostgREST to reload its schema cache.
 */
async function ensureUniversitiesTable() {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
        console.log('No SUPABASE_DB_PASSWORD or SUPABASE_DB_URL set — skipping direct table creation.');
        console.log('If the universities table does not exist, set SUPABASE_DB_PASSWORD in .env');
        return false;
    }

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
        // Create the table
        await pool.query(`
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
            CREATE INDEX IF NOT EXISTS idx_universities_wilaya ON universities (wilaya);
            CREATE INDEX IF NOT EXISTS idx_universities_display_order ON universities (display_order);
            CREATE INDEX IF NOT EXISTS idx_universities_is_active ON universities (is_active);
            ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
        `);

        // Create RLS policies (ignore errors if they already exist)
        try {
            await pool.query(`CREATE POLICY "allow_public_read" ON universities FOR SELECT USING (is_active = true)`);
        } catch (e) { /* policy exists */ }
        try {
            await pool.query(`CREATE POLICY "allow_all_for_service_role" ON universities FOR ALL USING (true) WITH CHECK (true)`);
        } catch (e) { /* policy exists */ }

        // Create trigger
        await pool.query(`
            CREATE OR REPLACE FUNCTION update_universities_updated_at() RETURNS TRIGGER AS $$
            BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
        `);
        try {
            await pool.query(`
                CREATE TRIGGER trigger_universities_updated_at
                BEFORE UPDATE ON universities FOR EACH ROW
                EXECUTE FUNCTION update_universities_updated_at();
            `);
        } catch (e) { /* trigger exists */ }

        // Tell PostgREST to pick up the new table
        await pool.query(`NOTIFY pgrst, 'reload schema'`);

        console.log('Universities table ensured via direct SQL');
        return true;
    } catch (err) {
        console.error('Direct SQL table creation failed:', err.message);
        return false;
    } finally {
        await pool.end();
    }
}

async function initializeDatabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error(
            'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.'
        );
    }

    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create universities table via direct SQL (bypasses PostgREST)
    await ensureUniversitiesTable();

    console.log('Checking database schema...');
    await ensureTablesExist();
    console.log('Connected to Supabase successfully — schema verified');

    try {
        await ensureStorageBucket();
    } catch (err) {
        console.error('Storage bucket setup failed (non-fatal):', err.message);
    }

    try { await createDefaultAdmin(); } catch (err) { console.error('Error seeding default admin:', err.message); }
    try { await initializeDefaultSpecialties(); } catch (err) { console.error('Error seeding default specialties:', err.message); }
    try { await initializeDefaultContent(); } catch (err) { console.error('Error seeding default page content:', err.message); }
    try { await initializeDefaultSettings(); } catch (err) { console.error('Error seeding default settings:', err.message); }
    try { await initializeDefaultUniversities(); } catch (err) { console.error('Error seeding default universities:', err.message); }

    try {
        const { count: adminCount } = await supabase.from('admins').select('*', { count: 'exact', head: true });
        const { count: contentCount } = await supabase.from('page_content').select('*', { count: 'exact', head: true });
        const { count: specCount } = await supabase.from('specialties').select('*', { count: 'exact', head: true });
        const { count: uniCount } = await supabase.from('universities').select('*', { count: 'exact', head: true });
        console.log('Seed status: admins=' + adminCount + ', page_content=' + contentCount + ', specialties=' + specCount + ', universities=' + uniCount);
    } catch (err) {
        console.error('Could not check seed status:', err.message);
    }

    console.log('Database initialized successfully!');
}

async function createDefaultAdmin() {
    const { data: existing } = await supabase
        .from('admins')
        .select('id')
        .eq('username', 'admin')
        .limit(1);

    if (!existing || existing.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        const { error } = await supabase
            .from('admins')
            .insert({ username: 'admin', password: hashedPassword });
        if (error) throw error;
        console.log('Default admin created (username: admin, password: admin123)');
        console.log('IMPORTANT: Please change the password after first login!');
    }
}

async function initializeDefaultSpecialties() {
    const { data: existing } = await supabase
        .from('specialties')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        const specialties = [
            {
                slug: 'medical',
                name_ar: 'العلوم الطبية',
                icon: '\uD83C\uDFE5',
                description_ar: 'تشمل تخصصات الطب العام وطب الأسنان والصيدلة والعلوم البيطرية',
                items_ar: JSON.stringify(['الطب العام', 'طب الأسنان', 'الصيدلة', 'التمريض', 'العلوم البيطرية']),
                duration_ar: '5-7 سنوات',
                display_order: 1
            },
            {
                slug: 'engineering',
                name_ar: 'الهندسة والتقنية',
                icon: '\u2699\uFE0F',
                description_ar: 'تخصصات هندسية متنوعة في أفضل الجامعات الجزائرية',
                items_ar: JSON.stringify(['الهندسة المدنية', 'الهندسة الكهربائية', 'الهندسة الميكانيكية', 'هندسة الحاسوب', 'الهندسة المعمارية']),
                duration_ar: '5 سنوات',
                display_order: 2
            },
            {
                slug: 'science',
                name_ar: 'العلوم الطبيعية',
                icon: '\uD83D\uDD2C',
                description_ar: 'العلوم الأساسية والتطبيقية',
                items_ar: JSON.stringify(['الرياضيات', 'الفيزياء', 'الكيمياء', 'البيولوجيا', 'علوم الأرض', 'المحروقات']),
                duration_ar: 'نظام LMD',
                display_order: 3
            },
            {
                slug: 'humanities',
                name_ar: 'العلوم الإنسانية',
                icon: '\uD83D\uDCDA',
                description_ar: 'تخصصات الآداب والعلوم الإنسانية',
                items_ar: JSON.stringify(['الأدب العربي', 'التاريخ', 'الفلسفة', 'علم النفس', 'علم الاجتماع']),
                duration_ar: 'نظام LMD',
                display_order: 4
            },
            {
                slug: 'law',
                name_ar: 'القانون والعلوم السياسية',
                icon: '\u2696\uFE0F',
                description_ar: 'القانون والعلاقات الدولية',
                items_ar: JSON.stringify(['القانون العام', 'القانون الخاص', 'العلوم السياسية', 'العلاقات الدولية']),
                duration_ar: 'نظام LMD',
                display_order: 5
            },
            {
                slug: 'economics',
                name_ar: 'الاقتصاد والتجارة',
                icon: '\uD83D\uDCBC',
                description_ar: 'العلوم الاقتصادية والتجارية وعلوم التسيير',
                items_ar: JSON.stringify(['العلوم الاقتصادية', 'العلوم التجارية', 'علوم التسيير', 'المحاسبة والمالية']),
                duration_ar: 'نظام LMD',
                display_order: 6
            }
        ];

        const { error } = await supabase.from('specialties').insert(specialties);
        if (error) throw error;
        console.log('Default specialties initialized!');
    }
}

async function initializeDefaultContent() {
    const { data: existing } = await supabase
        .from('page_content')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        console.log('Seeding default page content...');

        const rows = [];
        const add = (page, section, titleAr, contentAr, type, order) => {
            rows.push({
                page_name: page,
                section_id: section,
                section_title_ar: titleAr,
                content_ar: contentAr,
                content_type: type,
                display_order: order
            });
        };

        // HOME PAGE
        add('home', 'hero_title', 'عنوان البطل',
            'اتحاد الطلبة والمتدربين الموريتانيين في بومرداس',
            'text', 1);
        add('home', 'hero_subtitle', 'العنوان الفرعي',
            'معاً نحو التميز والنجاح في مسيرتنا الأكاديمية',
            'text', 2);
        add('home', 'stats_students', 'إحصائيات - طلاب', '500+', 'text', 3);
        add('home', 'stats_states', 'إحصائيات - ولايات', '15+', 'text', 4);
        add('home', 'stats_majors', 'إحصائيات - تخصصات', '30+', 'text', 5);
        add('home', 'stats_years', 'إحصائيات - سنوات', '10+', 'text', 6);
        add('home', 'about_preview_vision', 'الرؤية',
            'أن نكون الجسر الذي يربط الطلبة الموريتانيين بفرص النجاح والتميز في الجزائر',
            'text', 7);
        add('home', 'about_preview_mission', 'المهمة',
            'توفير الدعم الشامل للطلبة وتسهيل اندماجهم في الحياة الأكاديمية والاجتماعية',
            'text', 8);
        add('home', 'about_preview_values', 'القيم',
            'نؤمن بالتضامن، التميز، الشفافية والعمل الجماعي كقيم أساسية',
            'text', 9);
        add('home', 'cta_title', 'عنوان الدعوة',
            'انضم إلى عائلة اتحاد الطلبة',
            'text', 10);
        add('home', 'cta_text', 'نص الدعوة',
            'سجل الآن واستفد من خدماتنا المتنوعة ودعمنا المستمر طوال مسيرتك الأكاديمية',
            'text', 11);

        // ABOUT PAGE
        add('about', 'history_title', 'عنوان التاريخ',
            'تاريخ الاتحاد', 'text', 1);
        add('about', 'history_content', 'محتوى التاريخ',
            'تأسس اتحاد الطلبة والمتدربين الموريتانيين في بومرداس لخدمة الطلبة الموريتانيين الدارسين في بومرداس، ويسعى منذ تأسيسه إلى توفير بيئة داعمة تساعد الطلبة على التفوق الأكاديمي والاندماج في المجتمع الجزائري.',
            'html', 2);
        add('about', 'vision_title', 'عنوان الرؤية',
            'رؤيتنا', 'text', 3);
        add('about', 'vision_content', 'محتوى الرؤية',
            'أن نكون المرجع الأول والأفضل للطلبة الموريتانيين في الجزائر، ونساهم في بناء جيل متميز من الكفاءات الوطنية.',
            'html', 4);
        add('about', 'mission_title', 'عنوان المهمة',
            'مهمتنا', 'text', 5);
        add('about', 'mission_content', 'محتوى المهمة',
            'تقديم الدعم الشامل للطلبة الموريتانيين في جميع المجالات الأكاديمية والإدارية والاجتماعية.',
            'html', 6);

        // GUIDE PAGE
        add('guide', 'intro_title', 'عنوان الدليل',
            'دليل الطالب الشامل', 'text', 1);
        add('guide', 'intro_text', 'نص مقدمة الدليل',
            'كل ما تحتاج معرفته للحياة والدراسة في الجزائر',
            'text', 2);
        add('guide', 'accordion_bank_title', 'عنوان قسم البنك',
            '\uD83C\uDFE6 فتح حساب بنكي', 'text', 3);
        add('guide', 'accordion_bank', 'محتوى قسم البنك',
            '<h4>الوثائق المطلوبة:</h4><ul><li>جواز السفر ساري المفعول</li><li>شهادة الإقامة أو عقد الإيجار</li><li>شهادة التسجيل الجامعي</li><li>صورتان شمسيتان</li></ul>',
            'html', 4);
        add('guide', 'accordion_transport_title', 'عنوان قسم المواصلات',
            '\uD83D\uDE8C المواصلات والتنقل', 'text', 5);
        add('guide', 'accordion_transport', 'محتوى قسم المواصلات',
            '<h4>وسائل النقل في المدن:</h4><ul><li><strong>المترو:</strong> متوفر في الجزائر العاصمة</li><li><strong>الترامواي:</strong> متوفر في عدة مدن</li><li><strong>الحافلات:</strong> شبكة واسعة تغطي معظم الأحياء</li></ul>',
            'html', 6);
        add('guide', 'accordion_housing_title', 'عنوان قسم السكن',
            '\uD83C\uDFE0 السكن الجامعي', 'text', 7);
        add('guide', 'accordion_housing', 'محتوى قسم السكن',
            '<h4>أنواع السكن:</h4><ul><li><strong>الإقامة الجامعية:</strong> سكن مدعوم من الدولة</li><li><strong>السكن الخاص:</strong> غرف أو شقق للإيجار</li></ul>',
            'html', 8);
        add('guide', 'accordion_documents_title', 'عنوان قسم الوثائق',
            '\uD83D\uDCCB الوثائق المطلوبة', 'text', 9);
        add('guide', 'accordion_documents', 'محتوى قسم الوثائق',
            '<h4>الوثائق الأساسية:</h4><ul><li>جواز السفر ساري المفعول</li><li>شهادة البكالوريا مصدقة ومترجمة</li><li>كشف النقاط مصدق ومترجم</li><li>شهادة الميلاد مصدقة</li></ul>',
            'html', 10);

        // PROGRAMS PAGE
        add('programs', 'intro_title', 'عنوان التخصصات',
            'التخصصات الجامعية', 'text', 1);
        add('programs', 'intro_text', 'نص مقدمة التخصصات',
            'استكشف التخصصات المتاحة للطلبة الموريتانيين في الجامعات الجزائرية',
            'text', 2);

        // SERVICES PAGE
        add('services', 'intro_title', 'عنوان الخدمات',
            'خدمات الاتحاد', 'text', 1);
        add('services', 'intro_text', 'نص مقدمة الخدمات',
            'نقدم مجموعة متنوعة من الخدمات لدعم الطلبة في جميع جوانب حياتهم الأكاديمية',
            'text', 2);
        add('services', 'service_academic_title', 'عنوان الدعم الأكاديمي',
            'الدعم الأكاديمي', 'text', 3);
        add('services', 'service_academic', 'وصف الدعم الأكاديمي',
            'توجيه ومساعدة في اختيار التخصص، والتسجيل، والإجراءات الإدارية الجامعية.',
            'text', 4);
        add('services', 'service_admin_title', 'عنوان المساعدة الإدارية',
            'المساعدة الإدارية', 'text', 5);
        add('services', 'service_admin', 'وصف المساعدة الإدارية',
            'مساعدة في استخراج الوثائق، والإقامة، والتعامل مع الجهات الرسمية.',
            'text', 6);
        add('services', 'service_housing_title', 'عنوان استشارات السكن',
            'استشارات السكن', 'text', 7);
        add('services', 'service_housing', 'وصف استشارات السكن',
            'معلومات ونصائح حول الإقامة الجامعية والسكن الخاص.',
            'text', 8);

        // CONTACT PAGE
        add('contact', 'intro_title', 'عنوان التواصل',
            'تواصل معنا', 'text', 1);
        add('contact', 'intro_text', 'نص مقدمة التواصل',
            'نحن هنا لمساعدتك. لا تتردد في التواصل معنا لأي استفسار',
            'text', 2);
        add('contact', 'email', 'البريد الإلكتروني', 'contact@uema-dz.org', 'text', 3);
        add('contact', 'phone', 'الهاتف', '+213 XX XX XX XX', 'text', 4);
        add('contact', 'address', 'العنوان',
            'الجزائر العاصمة، الجزائر', 'text', 5);
        add('contact', 'hours', 'ساعات العمل',
            'السبت - الخميس: 9:00 - 17:00', 'text', 6);

        const batchSize = 20;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const { error } = await supabase.from('page_content').insert(batch);
            if (error) throw error;
        }

        console.log('Default page content initialized!');
    }
}

async function initializeDefaultSettings() {
    const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1);

    if (!existing || existing.length === 0) {
        const settings = [
            { setting_key: 'site_name', value_ar: 'اتحاد الطلبة والمتدربين الموريتانيين في بومرداس' },
            { setting_key: 'site_description', value_ar: 'منظمة طلابية تهدف لخدمة ودعم الطلبة الموريتانيين في بومرداس' },
            { setting_key: 'footer_text', value_ar: 'جميع الحقوق محفوظة' },
            { setting_key: 'site_logo', value_ar: '', setting_type: 'image' },
            { setting_key: 'site_favicon', value_ar: '', setting_type: 'image' },
            { setting_key: 'contact_email', value_ar: 'contact@uema-dz.org' },
            { setting_key: 'contact_phone', value_ar: '+213 XX XX XX XX' },
            { setting_key: 'contact_address', value_ar: 'الجزائر العاصمة، الجزائر' },
            { setting_key: 'social_facebook', value_ar: '' },
            { setting_key: 'social_instagram', value_ar: '' },
            { setting_key: 'social_telegram', value_ar: '' },
            { setting_key: 'social_whatsapp', value_ar: '' }
        ];

        const { error } = await supabase.from('site_settings').insert(settings);
        if (error) throw error;
        console.log('Default site settings initialized!');
    }
}

async function initializeDefaultUniversities() {
    // Try PostgREST first
    const { data: existing, error: checkError } = await supabase
        .from('universities')
        .select('id')
        .limit(1);

    // If PostgREST can't see the table, try direct SQL seeding
    if (checkError && (checkError.code === 'PGRST205' || checkError.message.includes('schema cache'))) {
        console.log('Universities table not in PostgREST cache — seeding via direct SQL...');
        await seedUniversitiesDirectSQL();
        return;
    }

    if (existing && existing.length > 0) return;

    console.log('Seeding default universities...');

    const unis = getUniversitiesList();


    const batchSize = 20;
    for (let i = 0; i < unis.length; i += batchSize) {
        const batch = unis.slice(i, i + batchSize);
        const { error } = await supabase.from('universities').insert(batch);
        if (error) throw error;
    }

    console.log('Default universities initialized! (' + unis.length + ' universities)');
}

/**
 * Seed universities via direct PostgreSQL connection (bypasses PostgREST).
 * Used when PostgREST hasn't yet loaded the universities table into its schema cache.
 */
async function seedUniversitiesDirectSQL() {
    const dbUrl = getDatabaseUrl();
    if (!dbUrl) {
        console.log('Cannot seed universities: no SUPABASE_DB_PASSWORD or SUPABASE_DB_URL in .env');
        return;
    }

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
        // Check if data already exists
        const { rows } = await pool.query('SELECT count(*) AS cnt FROM universities');
        if (parseInt(rows[0].cnt) > 0) {
            console.log('Universities already seeded (' + rows[0].cnt + ' records) — skipping');
            // Still notify PostgREST to reload in case it hasn't picked up the table
            await pool.query("NOTIFY pgrst, 'reload schema'");
            return;
        }

        // Build bulk INSERT from the same data
        const unis = getUniversitiesList();
        const values = [];
        const placeholders = [];
        let idx = 1;
        for (const u of unis) {
            placeholders.push(`($${idx}, $${idx+1}, $${idx+2}, $${idx+3})`);
            values.push(u.name_ar, u.wilaya, u.website_url || '', u.display_order);
            idx += 4;
        }

        await pool.query(
            `INSERT INTO universities (name_ar, wilaya, website_url, display_order) VALUES ${placeholders.join(',')}`,
            values
        );

        // Reload PostgREST schema cache
        await pool.query("NOTIFY pgrst, 'reload schema'");

        console.log('Universities seeded via direct SQL! (' + unis.length + ' records)');
    } catch (err) {
        console.error('Direct SQL seed failed:', err.message);
    } finally {
        await pool.end();
    }
}

/**
 * Returns the list of faculties and institutes of University of Boumerdes.
 * Used by both the PostgREST seeder and the direct SQL seeder.
 */
function getUniversitiesList() {
    return [
        { name_ar: 'كلية العلوم', wilaya: 'الكليات', website_url: 'https://fs.univ-boumerdes.dz/', display_order: 1 },
        { name_ar: 'كلية التكنولوجيا', wilaya: 'الكليات', website_url: 'https://ft.univ-boumerdes.dz/', display_order: 2 },
        { name_ar: 'كلية المحروقات والكيمياء', wilaya: 'الكليات', website_url: 'https://fhc.univ-boumerdes.dz/', display_order: 3 },
        { name_ar: 'كلية العلوم الاقتصادية والتجارية وعلوم التسيير', wilaya: 'الكليات', website_url: 'https://fsegc.univ-boumerdes.dz/', display_order: 4 },
        { name_ar: 'كلية الحقوق والعلوم السياسية', wilaya: 'الكليات', website_url: 'https://fdsp.univ-boumerdes.dz/', display_order: 5 },
        { name_ar: 'كلية الآداب واللغات', wilaya: 'الكليات', website_url: 'https://fll.univ-boumerdes.dz/', display_order: 6 },
        { name_ar: 'معهد الهندسة الكهربائية والإلكترونيك', wilaya: 'الكليات', website_url: 'https://igee.univ-boumerdes.dz/', display_order: 7 },
        { name_ar: 'معهد العلوم والتقنيات التطبيقية', wilaya: 'الكليات', website_url: 'https://ista.univ-boumerdes.dz/', display_order: 8 },
    ];
}

async function ensureTablesExist() {
    const requiredTables = ['admins', 'news', 'messages', 'page_content', 'hero_slides', 'specialties', 'site_settings', 'gallery', 'universities'];

    const missingTables = [];
    for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
        if (error && (error.code === '42P01' || error.code === 'PGRST205' || error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('schema cache'))) {
            missingTables.push(table);
        }
    }

    if (missingTables.length === 0) {
        console.log('All tables exist — skipping schema creation');
        return;
    }

    // Universities table is created via direct SQL — if it's the only missing one,
    // PostgREST may just need time to reload. Wait and retry once.
    if (missingTables.length === 1 && missingTables[0] === 'universities') {
        console.log('Waiting for PostgREST to reload universities table...');
        await new Promise(r => setTimeout(r, 3000));
        const { error } = await supabase.from('universities').select('id', { count: 'exact', head: true });
        if (!error) {
            console.log('Universities table is now visible');
            return;
        }
        console.warn('Universities table not yet visible to PostgREST — will retry seeding later');
        return;
    }

    throw new Error(
        'Missing tables: ' + missingTables.join(', ') + '. ' +
        'Please run the SQL migration in the Supabase SQL Editor.'
    );
}

async function ensureStorageBucket() {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw new Error('Failed to list storage buckets: ' + listError.message);

    const existing = buckets.find(b => b.name === 'uploads');
    if (!existing) {
        const { error: createError } = await supabase.storage.createBucket('uploads', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        if (createError) throw new Error('Failed to create storage bucket: ' + createError.message);
        console.log('Storage bucket "uploads" created (public)');
    } else {
        await supabase.storage.updateBucket('uploads', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });
        console.log('Storage bucket "uploads" verified');
    }
}

function getClient() {
    if (!supabase) {
        throw new Error('Database not connected yet. Please try again in a moment.');
    }
    return supabase;
}

async function getSeedStatus() {
    if (!supabase) return { connected: false };
    try {
        const { count: admins } = await supabase.from('admins').select('*', { count: 'exact', head: true });
        const { count: content } = await supabase.from('page_content').select('*', { count: 'exact', head: true });
        const { count: specs } = await supabase.from('specialties').select('*', { count: 'exact', head: true });
        return { connected: true, admins, page_content: content, specialties: specs };
    } catch (err) {
        return { connected: false, error: err.message };
    }
}

async function forceReseed() {
    if (!supabase) throw new Error('Database not connected.');
    await supabase.from('admins').delete().eq('username', 'admin');
    await supabase.from('page_content').delete().neq('id', 0);
    await supabase.from('specialties').delete().neq('id', 0);
    await supabase.from('site_settings').delete().neq('id', 0);
    await createDefaultAdmin();
    await initializeDefaultSpecialties();
    await initializeDefaultContent();
    await initializeDefaultSettings();
    return await getSeedStatus();
}

module.exports = {
    initializeDatabase,
    getSeedStatus,
    forceReseed,
    getClient
};
