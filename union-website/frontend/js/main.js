/**
 * Mauritanian Students Union Website
 * Frontend JavaScript - Arabic Only
 */

(function() {
    'use strict';

    const API = '/api';

    // ========================================
    // UI Text Constants
    // ========================================
    const UI = {
        read_more: 'اقرأ المزيد',
        loading: 'جاري التحميل...',
        sending: 'جاري الإرسال...',
        send: 'إرسال',
        sent_success: 'تم إرسال رسالتك بنجاح!',
        sent_error: 'حدث خطأ. حاول مرة أخرى.',
        field_required: 'هذا الحقل مطلوب',
        invalid_email: 'البريد الإلكتروني غير صالح',
        no_news: 'لا توجد أخبار حالياً',
        no_gallery: 'لا توجد صور حالياً',
        all: 'الكل',
        news: 'أخبار',
        events: 'الأنشطة',
        announcements: 'إعلانات',
        category_map: { news: 'أخبار', event: 'الأنشطة', announcement: 'إعلانات' }
    };

    // ========================================
    // Utility Functions
    // ========================================
    function $(selector) { return document.querySelector(selector); }
    function $$(selector) { return document.querySelectorAll(selector); }

    function formatDate(dateString) {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ar-DZ', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function sanitizeUrl(url) {
        if (!url) return '';
        if (/^(https?:\/\/|\/)/i.test(url)) return url;
        return '';
    }

    function showToast(message, type) {
        type = type || 'info';
        var existing = $('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('toast--hide');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // ========================================
    // Header & Navigation
    // ========================================
    function initHeader() {
        var header = $('#header');
        var menuBtn = $('#menuBtn');
        var mobileNav = $('#mobileNav');
        var mobileOverlay = $('#mobileOverlay');
        var mobileClose = $('#mobileNavClose');

        // Scroll effect
        window.addEventListener('scroll', function() {
            if (header) header.classList.toggle('header--scrolled', window.scrollY > 50);
            var backToTop = $('#backToTop');
            if (backToTop) backToTop.classList.toggle('back-to-top--visible', window.scrollY > 400);
        });

        // Mobile menu
        function openMobile() {
            if (mobileNav) mobileNav.classList.add('mobile-nav--open');
            if (mobileOverlay) mobileOverlay.classList.add('mobile-nav__overlay--open');
            document.body.style.overflow = 'hidden';
        }
        function closeMobile() {
            if (mobileNav) mobileNav.classList.remove('mobile-nav--open');
            if (mobileOverlay) mobileOverlay.classList.remove('mobile-nav__overlay--open');
            document.body.style.overflow = '';
        }

        if (menuBtn) menuBtn.addEventListener('click', openMobile);
        if (mobileClose) mobileClose.addEventListener('click', closeMobile);
        if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);

        // Close on link click
        $$('.mobile-nav__link').forEach(function(link) {
            link.addEventListener('click', closeMobile);
        });

        // Back to top
        var backToTop = $('#backToTop');
        if (backToTop) {
            backToTop.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Active nav link
        var currentPath = window.location.pathname;
        $$('.header__link, .mobile-nav__link').forEach(function(link) {
            var href = link.getAttribute('href');
            if (href === currentPath || (href === '/' && currentPath === '/') ||
                (href !== '/' && currentPath.startsWith(href))) {
                link.classList.add(link.classList.contains('header__link') ? 'header__link--active' : 'mobile-nav__link--active');
            }
        });
    }

    // ========================================
    // Site Settings (Logo, etc.)
    // ========================================
    async function loadSiteSettings() {
        try {
            var res = await fetch(API + '/media/settings');
            var data = await res.json();
            if (!data.success) return;

            var settings = data.data;

            // Logo
            if (settings.site_logo && settings.site_logo.value_ar) {
                var logoUrl = settings.site_logo.value_ar;
                $$('#siteLogo, #mobileNavLogo, #footerLogo').forEach(function(img) {
                    if (img) { img.src = logoUrl; img.style.display = ''; }
                });
            }

            // Footer text
            if (settings.footer_text && settings.footer_text.value_ar) {
                var el = $('#footerText');
                if (el) el.textContent = '\u00A9 ' + new Date().getFullYear() + ' ' + (settings.site_name && settings.site_name.value_ar ? settings.site_name.value_ar : '') + '. ' + settings.footer_text.value_ar;
            }

            // Description
            if (settings.site_description && settings.site_description.value_ar) {
                var descEl = $('#footerDesc');
                if (descEl) descEl.textContent = settings.site_description.value_ar;
            }

            // Contact info from settings
            if (settings.contact_email && settings.contact_email.value_ar) {
                document.querySelectorAll('#footerEmail, #email').forEach(el => {
                    if (el) el.textContent = settings.contact_email.value_ar;
                });
            }
            if (settings.contact_phone && settings.contact_phone.value_ar) {
                document.querySelectorAll('#footerPhone, #phone').forEach(el => {
                    if (el) el.textContent = settings.contact_phone.value_ar;
                });
            }
            if (settings.contact_address && settings.contact_address.value_ar) {
                document.querySelectorAll('#footerAddress, #address').forEach(el => {
                    if (el) el.textContent = settings.contact_address.value_ar;
                });
            }

            // Social links
            const socialLinks = [];
            if (settings.social_facebook && settings.social_facebook.value_ar) {
                socialLinks.push({ url: settings.social_facebook.value_ar, name: 'Facebook', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' });
            }
            if (settings.social_instagram && settings.social_instagram.value_ar) {
                socialLinks.push({ url: settings.social_instagram.value_ar, name: 'Instagram', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>' });
            }
            if (settings.social_telegram && settings.social_telegram.value_ar) {
                socialLinks.push({ url: settings.social_telegram.value_ar, name: 'Telegram', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>' });
            }
            if (settings.social_whatsapp && settings.social_whatsapp.value_ar) {
                socialLinks.push({ url: settings.social_whatsapp.value_ar, name: 'WhatsApp', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' });
            }

            // Update footer social links
            const footerSocial = document.getElementById('footerSocial');
            if (footerSocial && socialLinks.length > 0) {
                footerSocial.innerHTML = socialLinks.map(s =>
                    `<a href="${s.url}" target="_blank" rel="noopener" class="footer__social-link" aria-label="${s.name}">${s.icon}</a>`
                ).join('');
            }

            // Update contact page social links
            const contactSocial = document.getElementById('contactSocial');
            if (contactSocial && socialLinks.length > 0) {
                contactSocial.innerHTML = socialLinks.map(s =>
                    `<a href="${s.url}" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 12px 24px; background: white; border-radius: 12px; color: var(--color-text-dark); font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: all 0.3s; text-decoration: none;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.06)'">${s.icon} <span>${s.name}</span></a>`
                ).join('');
            }

            // Favicon
            if (settings.site_favicon && settings.site_favicon.value_ar) {
                let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
                link.type = 'image/x-icon';
                link.rel = 'shortcut icon';
                link.href = settings.site_favicon.value_ar;
                document.getElementsByTagName('head')[0].appendChild(link);
            }

            // Update CTA Facebook link
            const ctaFb = document.querySelector('.cta a[href*="facebook"]');
            if (ctaFb && settings.social_facebook && settings.social_facebook.value_ar) {
                ctaFb.href = settings.social_facebook.value_ar;
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    // ========================================
    // Hero Carousel
    // ========================================
    async function initHeroCarousel() {
        var slidesContainer = $('#heroSlides');
        var dotsContainer = $('#heroDots');
        if (!slidesContainer) return;

        try {
            var res = await fetch(API + '/media/hero');
            var data = await res.json();
            if (!data.success || !data.data.length) {
                // Show default slide if no slides
                slidesContainer.innerHTML =
                    '<div class="hero__slide hero__slide--active" style="background-image: linear-gradient(135deg, #064E2A, #0B6B3A);">' +
                        '<div class="hero__overlay"></div>' +
                        '<div class="hero__content container">' +
                            '<h1 class="hero__title">اتحاد الطلبة والمتدربين الموريتانيين بالجزائر</h1>' +
                            '<p class="hero__subtitle">معاً نحو التميز والنجاح في مسيرتنا الأكاديمية</p>' +
                        '</div>' +
                    '</div>';
                return;
            }

            var slides = data.data;
            var currentSlide = 0;

            // Render slides
            slidesContainer.innerHTML = slides.map(function(slide, i) {
                return '<div class="hero__slide ' + (i === 0 ? 'hero__slide--active' : '') + '" style="background-image: url(\'' + sanitizeUrl(slide.image_url) + '\');">' +
                    '<div class="hero__overlay"></div>' +
                    '<div class="hero__content container">' +
                        (slide.title_ar ? '<h1 class="hero__title">' + escapeHtml(slide.title_ar) + '</h1>' : '') +
                        (slide.subtitle_ar ? '<p class="hero__subtitle">' + escapeHtml(slide.subtitle_ar) + '</p>' : '') +
                        (slide.button_text_ar && slide.link_url ? '<a href="' + sanitizeUrl(slide.link_url) + '" class="btn btn--gold btn--lg hero__btn">' + escapeHtml(slide.button_text_ar) + '</a>' : '') +
                    '</div>' +
                '</div>';
            }).join('');

            // Render dots
            if (slides.length > 1) {
                dotsContainer.innerHTML = slides.map(function(_, i) {
                    return '<button class="hero__dot ' + (i === 0 ? 'hero__dot--active' : '') + '" data-index="' + i + '" aria-label="الشريحة ' + (i + 1) + '"></button>';
                }).join('');

                // Dot click
                dotsContainer.addEventListener('click', function(e) {
                    var dot = e.target.closest('.hero__dot');
                    if (!dot) return;
                    goToSlide(parseInt(dot.dataset.index));
                });

                // Auto-play
                var interval = setInterval(function() { goToSlide((currentSlide + 1) % slides.length); }, 5000);

                // Pause on hover
                var hero = $('#heroCarousel');
                hero.addEventListener('mouseenter', function() { clearInterval(interval); });
                hero.addEventListener('mouseleave', function() {
                    interval = setInterval(function() { goToSlide((currentSlide + 1) % slides.length); }, 5000);
                });
            }

            function goToSlide(index) {
                $$('.hero__slide').forEach(function(s, i) { s.classList.toggle('hero__slide--active', i === index); });
                $$('.hero__dot').forEach(function(d, i) { d.classList.toggle('hero__dot--active', i === index); });
                currentSlide = index;
            }

        } catch (e) {
            console.error('Error loading hero slides:', e);
        }
    }

    // ========================================
    // Load Page Content
    // ========================================
    async function loadPageContent(pageName) {
        try {
            var res = await fetch(API + '/pages/' + pageName);
            var data = await res.json();
            if (!data.success) return {};
            return data.data;
        } catch (e) {
            console.error('Error loading page content:', e);
            return {};
        }
    }

    // ========================================
    // Homepage Content (About section)
    // ========================================
    async function loadHomepageContent() {
        var content = await loadPageContent('home');

        // About preview
        var aboutText = $('#aboutText');
        if (aboutText && content.about_preview_vision) {
            aboutText.textContent = content.about_preview_vision.content_ar || '';
        }
    }

    // ========================================
    // News Loading
    // ========================================
    async function loadNews(container, limit, category) {
        if (!container) return;

        container.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 3rem;"><div class="spinner"></div></div>';

        try {
            var url = API + '/news?limit=' + (limit || 20);
            if (category && category !== 'all') url += '&category=' + category;

            var res = await fetch(url);
            var data = await res.json();

            if (!data.success || !data.data.length) {
                container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1; padding: 3rem;">' + UI.no_news + '</p>';
                return;
            }

            container.innerHTML = data.data.map(function(news) {
                var imageHtml;
                if (news.image_url) {
                    imageHtml = '<img class="news-card__image" src="' + sanitizeUrl(news.image_url) + '" alt="' + escapeHtml(news.title_ar) + '" loading="lazy">';
                } else {
                    imageHtml = '<div class="news-card__image" style="background: linear-gradient(135deg, #0B6B3A, #064E2A); display: flex; align-items: center; justify-content: center;">' +
                        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/></svg>' +
                    '</div>';
                }
                return '<article class="news-card">' +
                    imageHtml +
                    '<div class="news-card__body">' +
                        '<span class="news-card__date">' + formatDate(news.created_at) + '</span>' +
                        '<h3 class="news-card__title">' + escapeHtml(news.title_ar) + '</h3>' +
                        '<p class="news-card__summary">' + escapeHtml(news.summary_ar || '') + '</p>' +
                    '</div>' +
                '</article>';
            }).join('');

        } catch (e) {
            console.error('Error loading news:', e);
            container.innerHTML = '<p class="text-center text-muted" style="grid-column: 1/-1;">' + UI.sent_error + '</p>';
        }
    }

    // ========================================
    // Gallery Loading
    // ========================================
    async function loadGallery() {
        const container = document.getElementById('galleryGrid');
        if (!container) return;

        try {
            const res = await fetch(API + '/gallery');
            const data = await res.json();

            if (!data.success || !data.data.length) {
                container.closest('.section').style.display = 'none';
                return;
            }

            // Group by album
            const albums = {};
            data.data.forEach(item => {
                const album = item.album_ar || '\u0639\u0627\u0645';
                if (!albums[album]) albums[album] = [];
                albums[album].push(item);
            });

            const albumNames = Object.keys(albums);

            // If only one album or all same, show flat grid
            if (albumNames.length <= 1) {
                container.innerHTML = data.data.map(item =>
                    '<div class="gallery__item">' +
                        '<img src="' + sanitizeUrl(item.image_url) + '" alt="' + escapeHtml(item.caption_ar || '') + '" loading="lazy">' +
                        (item.caption_ar ? '<div class="gallery__overlay"><span class="gallery__caption">' + escapeHtml(item.caption_ar) + '</span></div>' : '') +
                    '</div>'
                ).join('');
            } else {
                // Show album tabs + grid
                let html = '<div style="display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap; justify-content: center;">';
                html += '<button class="news-filter__btn news-filter__btn--active" data-album="all">\u0627\u0644\u0643\u0644</button>';
                albumNames.forEach(name => {
                    html += '<button class="news-filter__btn" data-album="' + escapeHtml(name) + '">' + escapeHtml(name) + '</button>';
                });
                html += '</div>';
                html += '<div class="gallery__grid" id="galleryImages">';
                html += data.data.map(item =>
                    '<div class="gallery__item" data-album="' + escapeHtml(item.album_ar || '\u0639\u0627\u0645') + '">' +
                        '<img src="' + sanitizeUrl(item.image_url) + '" alt="' + escapeHtml(item.caption_ar || '') + '" loading="lazy">' +
                        (item.caption_ar ? '<div class="gallery__overlay"><span class="gallery__caption">' + escapeHtml(item.caption_ar) + '</span></div>' : '') +
                    '</div>'
                ).join('');
                html += '</div>';

                container.innerHTML = html;

                // Album filter
                container.addEventListener('click', function(e) {
                    const btn = e.target.closest('.news-filter__btn');
                    if (!btn) return;

                    container.querySelectorAll('.news-filter__btn').forEach(b => b.classList.remove('news-filter__btn--active'));
                    btn.classList.add('news-filter__btn--active');

                    const album = btn.dataset.album;
                    container.querySelectorAll('.gallery__item').forEach(item => {
                        item.style.display = (album === 'all' || item.dataset.album === album) ? '' : 'none';
                    });
                });
            }

        } catch (e) {
            console.error('Error loading gallery:', e);
        }
    }

    // ========================================
    // Contact Form
    // ========================================
    function initContactForm() {
        var form = $('#contactForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Clear errors
            $$('.form-error').forEach(function(el) { el.remove(); });

            var name = form.querySelector('[name="name"]').value.trim();
            var email = form.querySelector('[name="email"]').value.trim();
            var phoneEl = form.querySelector('[name="phone"]');
            var phone = phoneEl ? phoneEl.value.trim() : '';
            var subject = form.querySelector('[name="subject"]').value.trim();
            var message = form.querySelector('[name="message"]').value.trim();

            // Validate
            var valid = true;
            function showError(field, msg) {
                var input = form.querySelector('[name="' + field + '"]');
                var error = document.createElement('div');
                error.className = 'form-error';
                error.textContent = msg;
                input.parentNode.appendChild(error);
                valid = false;
            }

            if (!name) showError('name', UI.field_required);
            if (!email) showError('email', UI.field_required);
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) showError('email', UI.invalid_email);
            if (!subject) showError('subject', UI.field_required);
            if (!message) showError('message', UI.field_required);

            if (!valid) return;

            var submitBtn = form.querySelector('[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = UI.sending;
            submitBtn.disabled = true;

            try {
                var res = await fetch(API + '/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, email: email, phone: phone, subject: subject, message: message })
                });
                var data = await res.json();

                if (data.success) {
                    showToast(UI.sent_success, 'success');
                    form.reset();
                } else {
                    showToast(data.message || UI.sent_error, 'error');
                }
            } catch (err) {
                showToast(UI.sent_error, 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // ========================================
    // News Filter (for news page)
    // ========================================
    function initNewsFilter() {
        var filterContainer = $('#newsFilter');
        var newsContainer = $('#newsGrid');
        if (!filterContainer || !newsContainer) return;

        filterContainer.addEventListener('click', function(e) {
            var btn = e.target.closest('.news-filter__btn');
            if (!btn) return;

            $$('.news-filter__btn').forEach(function(b) { b.classList.remove('news-filter__btn--active'); });
            btn.classList.add('news-filter__btn--active');

            loadNews(newsContainer, null, btn.dataset.category);
        });

        // Load initial
        loadNews(newsContainer);
    }

    // ========================================
    // Accordion (for guide page)
    // ========================================
    function initAccordion() {
        $$('.accordion__header').forEach(function(header) {
            header.addEventListener('click', function() {
                var item = header.closest('.accordion__item');
                var wasActive = item.classList.contains('accordion__item--active');

                // Close all
                $$('.accordion__item').forEach(function(i) { i.classList.remove('accordion__item--active'); });

                // Toggle clicked
                if (!wasActive) item.classList.add('accordion__item--active');
            });
        });
    }

    // ========================================
    // Scroll Animations (Intersection Observer)
    // ========================================
    function initScrollAnimations() {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        $$('.fade-in').forEach(function(el) { observer.observe(el); });
    }

    // ========================================
    // Page Detection & Initialization
    // ========================================
    function detectPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        const match = path.match(/\/(\w+)/);
        return match ? match[1] : 'home';
    }

    async function initPage() {
        var page = detectPage();

        // Common
        initHeader();
        loadSiteSettings();
        initScrollAnimations();

        switch (page) {
            case 'home':
                initHeroCarousel();
                loadHomepageContent();
                loadNews($('#latestNews'), 3);
                loadGallery();
                break;

            case 'news':
                initNewsFilter();
                break;

            case 'about':
                var aboutContent = await loadPageContent('about');
                Object.keys(aboutContent).forEach(function(key) {
                    var el = document.getElementById(key);
                    if (el && aboutContent[key]) {
                        if (aboutContent[key].type === 'html') {
                            el.innerHTML = aboutContent[key].content_ar || '';
                        } else {
                            el.textContent = aboutContent[key].content_ar || '';
                        }
                    }
                });
                break;

            case 'guide':
                initScrollAnimations();
                break;

            case 'services':
                var servicesContent = await loadPageContent('services');
                Object.keys(servicesContent).forEach(function(key) {
                    var el = document.getElementById(key);
                    if (el && servicesContent[key]) {
                        if (servicesContent[key].type === 'html') {
                            el.innerHTML = servicesContent[key].content_ar || '';
                        } else {
                            el.textContent = servicesContent[key].content_ar || '';
                        }
                    }
                });
                break;

            case 'universities':
            case 'institutes':
                initScrollAnimations();
                break;

            case 'contact':
                var contactContent = await loadPageContent('contact');
                Object.keys(contactContent).forEach(function(key) {
                    var el = document.getElementById(key);
                    if (el && contactContent[key]) {
                        el.textContent = contactContent[key].content_ar || '';
                    }
                });
                initContactForm();
                break;
        }
    }

    // ========================================
    // Start
    // ========================================
    document.addEventListener('DOMContentLoaded', initPage);

})();
