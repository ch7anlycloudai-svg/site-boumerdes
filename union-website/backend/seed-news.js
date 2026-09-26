/**
 * Seed Script - Add sample news articles (Arabic)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { initializeDatabase, getClient } = require('./models/database');

const sampleNews = [
    {
        title_ar: 'افتتاح التسجيلات للعام الجامعي 2024-2025',
        content_ar: 'يسر اتحاد الطلبة الموريتانيين بالجزائر أن يعلن عن افتتاح التسجيلات للعام الجامعي الجديد 2024-2025. يمكن للطلبة الجدد التسجيل عبر منصة PROGRES الإلكترونية. الموعد النهائي للتسجيل هو 30 سبتمبر 2024. للمزيد من المعلومات، يرجى التواصل مع الاتحاد.',
        summary_ar: 'افتتاح التسجيلات للعام الجامعي الجديد عبر منصة PROGRES',
        category: 'announcement',
        location: 'الجزائر العاصمة',
        published: true
    },
    {
        title_ar: 'لقاء تعارفي للطلبة الجدد',
        content_ar: 'ينظم اتحاد الطلبة الموريتانيين لقاءً تعارفياً للطلبة الجدد يوم السبت القادم. سيتضمن اللقاء جلسة توجيهية حول الحياة الجامعية في الجزائر، ونصائح للتأقلم مع البيئة الجديدة.',
        summary_ar: 'لقاء تعارفي وتوجيهي للطلبة الجدد',
        category: 'event',
        location: 'قاعة المحاضرات - جامعة الجزائر',
        published: true
    },
    {
        title_ar: 'نجاح باهر للطلبة الموريتانيين في الامتحانات',
        content_ar: 'نثمن ونهنئ جميع الطلبة الموريتانيين الذين حققوا نتائج متميزة في امتحانات الفصل الأول. حقق طلبتنا معدلات نجاح عالية في مختلف التخصصات.',
        summary_ar: 'نتائج متميزة لطلبتنا في امتحانات الفصل الأول',
        category: 'news',
        location: null,
        published: true
    },
    {
        title_ar: 'ورشة عمل: كيفية كتابة السيرة الذاتية',
        content_ar: 'ينظم الاتحاد ورشة عمل حول كتابة السيرة الذاتية والتحضير لمقابلات العمل. ستقدم الورشة نصائح عملية لإعداد سيرة ذاتية احترافية.',
        summary_ar: 'ورشة عمل حول كتابة السيرة الذاتية',
        category: 'event',
        location: 'مقر الاتحاد',
        published: true
    },
    {
        title_ar: 'تحديث: إجراءات تجديد الإقامة',
        content_ar: 'نود إبلاغ الطلبة بالإجراءات الجديدة لتجديد الإقامة. يجب تقديم الطلب قبل شهر من انتهاء صلاحية الإقامة الحالية.',
        summary_ar: 'إجراءات جديدة لتجديد الإقامة',
        category: 'announcement',
        location: null,
        published: true
    },
    {
        title_ar: 'احتفالية عيد الاستقلال الموريتاني',
        content_ar: 'بمناسبة الذكرى السنوية لاستقلال موريتانيا، ينظم الاتحاد احتفالية خاصة تتضمن فقرات ثقافية وفنية متنوعة.',
        summary_ar: 'احتفالية بمناسبة عيد الاستقلال',
        category: 'event',
        location: 'قاعة الاحتفالات الكبرى',
        published: true
    }
];

async function seedNews() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();

        const supabase = getClient();

        console.log('\nAdding sample news articles...\n');

        for (const [index, news] of sampleNews.entries()) {
            const { error } = await supabase.from('news').insert(news);
            if (error) throw error;
            console.log(`${index + 1}. ${news.title_ar.substring(0, 50)}...`);
        }

        console.log(`\nDone! Added ${sampleNews.length} news articles.`);
        console.log('\nYou can view them at:');
        console.log('- Website: http://localhost:3000/news');
        console.log('- Admin: http://localhost:3000/admin/news.html');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding news:', error);
        process.exit(1);
    }
}

seedNews();
