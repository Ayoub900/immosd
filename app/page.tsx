'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Building2, Users, Target, Award, CheckCircle2, Menu, X } from 'lucide-react';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between md:justify-between items-center relative">
            {/* Logo and Company Name - Centered on mobile, left on desktop */}
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                <Image
                  src="/logo.png"
                  alt="immobiliercharkaoui Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-center md:text-right">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">immobiliercharkaoui</h1>
                <p className="text-xs sm:text-sm text-gray-600">البناء والأشغال العمومية</p>
              </div>
            </div>

            {/* Desktop Navigation - Now on the RIGHT - Hidden on mobile */}
            <nav className="hidden md:flex gap-8 items-center">
              <a href="#about" className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors">
                من نحن
              </a>
              <a href="#services" className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors">
                خدماتنا
              </a>
              <a href="#values" className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors">
                قيمنا
              </a>
              <a href="#contact" className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors bg-[#1481c8]/10 px-6 py-2 rounded-lg hover:bg-[#1481c8]/20">
                اتصل بنا
              </a>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-[#1481c8] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors py-2 px-4 hover:bg-gray-50 rounded-lg"
              >
                من نحن
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors py-2 px-4 hover:bg-gray-50 rounded-lg"
              >
                خدماتنا
              </a>
              <a
                href="#values"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors py-2 px-4 hover:bg-gray-50 rounded-lg"
              >
                قيمنا
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-[#1481c8] font-medium transition-colors bg-[#1481c8]/10 px-4 py-2 rounded-lg hover:bg-[#1481c8]/20"
              >
                اتصل بنا
              </a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image src="/hero-bg.jpg" alt="" fill className="object-cover" />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-blue-900/60"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 z-10">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              شركة رائدة في البناء
              <br />
              <span className="text-[#1481c8] drop-shadow-xl">والأشغال العمومية</span>
            </h2>
            <p className="text-xl text-white/95 max-w-4xl mx-auto leading-relaxed mb-8 drop-shadow-md">
              تتدخل شركة <strong>IMMO S D CHERKAOUI (immobiliercharkaoui)</strong> في مجال البناء والأشغال العمومية، حيث تضمن
              إنجاز مختلف مشاريع البناء والتهيئة، مع الحرص الدائم على الجودة والصرامة وإرضاء العملاء.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="#about"
                className="bg-gradient-to-r from-[#1481c8] to-[#0d6db0] hover:from-[#0d6db0] hover:to-[#0a5a91] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                اكتشف المزيد
              </a>
              <a
                href="#contact"
                className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg border-2 border-gray-200 transition-all shadow-md hover:shadow-lg"
              >
                اتصل بنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">من نحن</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-[#1481c8] to-[#0a5a91] rounded-2xl p-12 text-white shadow-2xl">
                <Building2 size={64} className="mb-6" />
                <h3 className="text-3xl font-bold mb-4">خبرة وجودة</h3>
                <p className="text-lg leading-relaxed">
                  نحن شركة متخصصة في البناء والأشغال العمومية، ملتزمون بتقديم خدمات عالية الجودة
                  وتنفيذ مشاريع متنوعة تلبي احتياجات عملائنا.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="bg-[#1481c8]/10 p-3 rounded-lg">
                  <CheckCircle2 className="text-[#1481c8]" size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">الجودة</h4>
                  <p className="text-gray-600">
                    نحرص على تقديم أعمال ذات جودة عالية تتوافق مع المعايير الدولية
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-[#1481c8]/10 p-3 rounded-lg">
                  <CheckCircle2 className="text-[#1481c8]" size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">الصرامة</h4>
                  <p className="text-gray-600">
                    نتبع أساليب عمل صارمة ومنهجية لضمان احترام المواعيد والمعايير
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="bg-[#1481c8]/10 p-3 rounded-lg">
                  <CheckCircle2 className="text-[#1481c8]" size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">رضا العملاء</h4>
                  <p className="text-gray-600">
                    رضا عملائنا هو أولويتنا القصوى في كل مشروع نقوم به
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">خدماتنا</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
            <p className="mt-4 text-xl text-gray-600">نقدم مجموعة متنوعة من الخدمات في مجال البناء والتهيئة</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="bg-[#1481c8]/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="text-[#1481c8]" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">البناء السكني</h3>
              <p className="text-gray-600 leading-relaxed">
                بناء عمارات سكنية وفيلات بمعايير عالية الجودة ومواصفات عصرية
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="bg-purple-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <Target className="text-purple-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">الأشغال العمومية</h3>
              <p className="text-gray-600 leading-relaxed">
                إنجاز مشاريع البنية التحتية والطرق والمنشآت العمومية
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="text-green-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">التهيئة والتطوير</h3>
              <p className="text-gray-600 leading-relaxed">
                تهيئة المساحات وتطوير المشاريع العقارية والسياحية
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#1481c8] to-[#0a5a91] rounded-3xl p-12 text-white shadow-2xl">
            <div className="max-w-4xl mx-auto text-center">
              <Award size={64} className="mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">رؤيتنا المستقبلية</h2>
              <p className="text-xl leading-relaxed mb-8">
                تطمح الشركة إلى تطوير أنشطتها، وتعزيز كفاءاتها التقنية والبشرية، واعتماد أساليب حديثة
                من أجل مواكبة تطور القطاع وإنجاز مشاريع كبرى، قائمة على الثقة والاحترافية.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <p className="font-bold">التطوير المستمر</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <p className="font-bold">الكفاءة التقنية</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <p className="font-bold">الأساليب الحديثة</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
                  <p className="font-bold">الاحترافية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">قيمنا</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="text-4xl mb-3">🏗️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">الجودة</h3>
              <p className="text-sm text-gray-600">التزام بأعلى معايير الجودة</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">الثقة</h3>
              <p className="text-sm text-gray-600">بناء علاقات قائمة على الثقة</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">الاحترافية</h3>
              <p className="text-sm text-gray-600">تعامل احترافي في كل المشاريع</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">الابتكار</h3>
              <p className="text-sm text-gray-600">اعتماد حلول مبتكرة وحديثة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-[#1481c8] to-[#0a5a91] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">هل لديك مشروع؟</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            نحن هنا لمساعدتك في تحقيق رؤيتك. اتصل بنا اليوم للحصول على استشارة مجانية
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="mailto:immobiliercharkaoui@gmail.com"
              className="bg-white text-[#1481c8] hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              📧 البريد الإلكتروني
            </a>
            <a
              href="tel:+212"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              📞 اتصل بنا
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="IMMO S D CHERKAOUI Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold">immobiliercharkaoui</h3>
              </div>
              <p className="text-gray-400">
                شركة رائدة في البناء والأشغال العمومية بالمغرب
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">الخدمات</h3>
              <ul className="space-y-2 text-gray-400">
                <li>البناء السكني</li>
                <li>الأشغال العمومية</li>
                <li>التهيئة والتطوير</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">اتصل بنا</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📧 immobiliercharkaoui@gmail.com</li>
                <li>📞 +212 XXX XXX XXX</li>
                <li>📍 المغرب</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} immobiliercharkaoui - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
