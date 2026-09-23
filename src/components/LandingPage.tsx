import React from 'react';
import {
  COURSE_TRACKS,
  ROADMAP_LESSONS,
  LEARNING_CYCLE_STEPS,
  CLASSROOM_EXAMPLE,
  TEACHER_PROFILE,
  COURSE_FINAL_SKILL,
  COURSE_ROADMAP_NOTE,
} from '../data/roadmap';
import { HeroShowcase } from './HeroShowcase';
import {
  Compass,
  ArrowRight,
  Code2,
  Cpu,
  Network,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
  onGoToWorkshop: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToWorkshop }) => {
  return (
    <div className="landing-page-root">
      {/* Top Brand Navigation */}
      <header className="landing-header">
        <div className="landing-container header-inner">
          <div className="brand-lockup">
            <div className="brand-logo" aria-hidden="true">
              <Compass size={24} />
            </div>
            <div>
              <span className="brand-name">Робот и код</span>
              <span className="brand-tagline">Курс программирования для 4 класса</span>
            </div>
          </div>

          <nav className="landing-nav" aria-label="Разделы страницы">
            <a href="#about" className="nav-link">О курсе</a>
            <a href="#method" className="nav-link">Методика</a>
            <a href="#roadmap" className="nav-link">Маршрут</a>
            <a href="#teacher" className="nav-link">Преподаватель</a>
          </nav>

          <div className="header-action">
            <button
              type="button"
              className="btn-header-cta"
              onClick={onGoToWorkshop}
            >
              <span>В мастерскую (Урок 1)</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* =========================================================================
            Section 1: Hero — Asymmetric Split (Display Headline + Live Simulator)
            ========================================================================= */}
        <section className="hero-section" id="about" aria-labelledby="hero-title">
          <div className="landing-container hero-grid">
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="eyebrow-pill">Очный курс для 4 класса</span>
                <span className="eyebrow-accent">Инженерное мышление</span>
              </div>

              <h1 id="hero-title" className="hero-title">
                Ученик учится думать, писать и проверять программу
              </h1>

              <p className="hero-lead">
                От первых шагов робота по клеткам до компилятора C, платы Arduino и устройства сети. Без готовых ответов от ИИ — через предсказание, запуск и самостоятельную отладку.
              </p>

              <div className="hero-cta-group">
                <button
                  type="button"
                  className="btn-primary-cta"
                  onClick={onGoToWorkshop}
                >
                  <span>Попробовать первый урок</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <span className="hero-cta-note">
                  Бесплатно, в браузере, без регистрации. 3 миссии первого занятия.
                </span>
              </div>

              <div className="hero-metrics" aria-label="Параметры курса">
                <div className="metric-item">
                  <span className="metric-val">45–60 мин</span>
                  <span className="metric-desc">длительность очной встречи</span>
                </div>
                <div className="metric-divider" aria-hidden="true" />
                <div className="metric-item">
                  <span className="metric-val">0 подсказок</span>
                  <span className="metric-desc">от ИИ во время попытки ребёнка</span>
                </div>
                <div className="metric-divider" aria-hidden="true" />
                <div className="metric-item">
                  <span className="metric-val">1 проект</span>
                  <span className="metric-desc">своё устройство в конце года</span>
                </div>
              </div>
            </div>

            {/* Right: Live Authentic Robot Showcase */}
            <div className="hero-visual">
              <HeroShowcase onGoToWorkshop={onGoToWorkshop} />
            </div>
          </div>
        </section>

        {/* =========================================================================
            Section 2: How It Works — 4-Step Cognitive Loop & Classroom Example
            ========================================================================= */}
        <section className="section-method" id="method" aria-labelledby="method-title">
          <div className="landing-container">
            <div className="section-header">
              <span className="section-label">Принцип обучения</span>
              <h2 id="method-title" className="section-title">
                Как устроено обучение: 4 шага каждой задачи
              </h2>
              <p className="section-subtitle">
                Компьютер не догадывается о намерениях: он исполняет ровно те команды, которые получил. Мы тренируем мысленную модель программы до запуска и хладнокровный поиск причин при ошибке.
              </p>
            </div>

            {/* The 4-step sequence */}
            <div className="steps-flow-grid">
              {LEARNING_CYCLE_STEPS.map((stepItem) => (
                <div key={stepItem.step} className="step-card">
                  <div className="step-num-badge">Шаг {stepItem.step}</div>
                  <h3 className="step-card-title">{stepItem.title}</h3>
                  <p className="step-card-desc">{stepItem.description}</p>
                </div>
              ))}
            </div>

            {/* Authentic Classroom Case Study */}
            <div className="case-study-box">
              <div className="case-study-header">
                <div className="case-icon-badge" aria-hidden="true">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="case-title">{CLASSROOM_EXAMPLE.task}</h3>
                  <span className="case-subtitle">Как ребёнок учится на ошибке</span>
                </div>
              </div>

              <div className="case-grid">
                <div className="case-block">
                  <span className="case-block-label">Заготовка программы</span>
                  <div className="case-code-chips">
                    {CLASSROOM_EXAMPLE.initialCode.map((cmd, i) => (
                      <span key={i} className={`code-chip ${i === 1 ? 'chip-error-highlight' : ''}`}>
                        {i + 1}. {cmd}
                      </span>
                    ))}
                  </div>
                  <p className="case-desc">{CLASSROOM_EXAMPLE.conflict}</p>
                </div>

                <div className="case-block">
                  <span className="case-block-label">Решение и вывод</span>
                  <p className="case-desc-solution">{CLASSROOM_EXAMPLE.solution}</p>
                  <p className="case-insight">
                    <strong>Инженерный принцип:</strong> {CLASSROOM_EXAMPLE.insight}
                  </p>
                </div>
              </div>
            </div>

            {/* Teacher Role vs Absence of AI */}
            <div className="pedagogy-duo-grid">
              <div className="pedagogy-card">
                <div className="pedagogy-card-header">
                  <HelpCircle size={22} className="pedagogy-icon teacher-icon" aria-hidden="true" />
                  <h3 className="pedagogy-title">Роль преподавателя</h3>
                </div>
                <p className="pedagogy-text">
                  Преподаватель не стоит над душой и не диктует команды. Он задаёт наводящие вопросы: <em>«Куда смотрит робот прямо сейчас?»</em>, <em>«Что изменится, если убрать этот поворот?»</em>. Ребёнок сам нажимает клавиши и сам проверяет результат.
                </p>
              </div>

              <div className="pedagogy-card">
                <div className="pedagogy-card-header">
                  <AlertCircle size={22} className="pedagogy-icon ai-icon" aria-hidden="true" />
                  <h3 className="pedagogy-title">Почему во время урока нет ИИ-подсказок</h3>
                </div>
                <p className="pedagogy-text">
                  ИИ помогает преподавателю готовить задания и анализировать методику до и после урока. Но на экране ребёнка намеренно нет кнопки «Сгенерировать решение». Если за ребёнка думает языковая модель, навык самостоятельного рассуждения не возникает.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            Section 3: Course Roadmap — 4 Tracks & Exploratory Topics
            ========================================================================= */}
        <section className="section-roadmap" id="roadmap" aria-labelledby="roadmap-title">
          <div className="landing-container">
            <div className="section-header">
              <span className="section-label">Траектория развития</span>
              <h2 id="roadmap-title" className="section-title">
                Маршрут курса: от первого алгоритма до C и железа
              </h2>
              <p className="section-subtitle">
                {COURSE_ROADMAP_NOTE}
              </p>
              <div className="final-skill-banner">
                <Sparkles size={20} className="skill-icon" aria-hidden="true" />
                <span><strong>Конечная цель («Северная звезда»):</strong> {COURSE_FINAL_SKILL}</span>
              </div>
            </div>

            {/* 4 Tracks Grid */}
            <div className="tracks-grid">
              {COURSE_TRACKS.map((track) => (
                <div key={track.id} className="track-card">
                  <div className="track-card-top">
                    <span className="track-range-badge">{track.topicRange}</span>
                    <span className={`track-status-pill ${track.id === 1 ? 'pill-available' : 'pill-planned'}`}>
                      {track.badge}
                    </span>
                  </div>

                  <div className="track-card-icon-wrap" aria-hidden="true">
                    {track.id === 1 && <Compass size={24} />}
                    {track.id === 2 && <Code2 size={24} />}
                    {track.id === 3 && <Cpu size={24} />}
                    {track.id === 4 && <Network size={24} />}
                  </div>

                  <h3 className="track-card-title">{track.title}</h3>
                  <span className="track-card-subtitle">{track.subtitle}</span>
                  <p className="track-card-desc">{track.description}</p>

                  <div className="track-result-box">
                    <span className="track-result-label">Осязаемый результат:</span>
                    <p className="track-result-text">{track.tangibleResult}</p>
                  </div>

                  {track.id === 1 && (
                    <button
                      type="button"
                      className="track-enter-btn"
                      onClick={onGoToWorkshop}
                    >
                      <span>Открыть интерактивный Урок 1</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Exploratory Topics Detailed Table */}
            <div className="roadmap-table-wrapper">
              <div className="table-header-block">
                <h3 className="table-title">12 тем разведочного маршрута</h3>
                <span className="table-caption">
                  Один урок доступен онлайн прямо сейчас, остальные темы реализуются на очных занятиях.
                </span>
              </div>

              <div className="lessons-list">
                {ROADMAP_LESSONS.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`lesson-row ${lesson.status === 'available' ? 'row-available' : ''}`}
                  >
                    <div className="lesson-id-col">
                      <span className="lesson-number-badge">Тема {lesson.id}</span>
                      {lesson.status === 'available' ? (
                        <span className="badge-status-online">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          <span>Доступно онлайн</span>
                        </span>
                      ) : (
                        <span className="badge-status-plan">План курса</span>
                      )}
                    </div>

                    <div className="lesson-info-col">
                      <div className="lesson-track-tag">{lesson.trackTitle}</div>
                      <h4 className="lesson-row-title">{lesson.title}</h4>
                      <p className="lesson-row-result">
                        <strong>Практический результат:</strong> {lesson.practicalResult}
                      </p>
                    </div>

                    <div className="lesson-transition-col">
                      <span className="transition-label">Критерий перехода:</span>
                      <p className="transition-text">{lesson.transitionCondition}</p>
                    </div>

                    <div className="lesson-action-col">
                      {lesson.status === 'available' ? (
                        <button
                          type="button"
                          className="btn-lesson-enter"
                          onClick={onGoToWorkshop}
                        >
                          <span>Пройти</span>
                          <ChevronRight size={14} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="lesson-planned-label">Очно</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            Section 4: Teacher Profile — Authentic & Restrained
            ========================================================================= */}
        <section className="section-teacher" id="teacher" aria-labelledby="teacher-title">
          <div className="landing-container">
            <div className="teacher-card">
              <div className="teacher-header-row">
                <div className="teacher-avatar-badge" aria-hidden="true">
                  <Code2 size={32} />
                </div>
                <div>
                  <span className="teacher-eyebrow">Автор и преподаватель курса</span>
                  <h2 id="teacher-title" className="teacher-name">{TEACHER_PROFILE.name}</h2>
                  <span className="teacher-role">{TEACHER_PROFILE.role}</span>
                </div>
              </div>

              <p className="teacher-summary">{TEACHER_PROFILE.experienceSummary}</p>

              <div className="teacher-columns">
                <div className="teacher-col">
                  <h3 className="col-heading">Инженерный и практический опыт</h3>
                  <ul className="teacher-bullet-list">
                    {TEACHER_PROFILE.highlights.map((item, idx) => (
                      <li key={idx} className="teacher-bullet-item">
                        <CheckCircle2 size={16} className="bullet-check" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="teacher-col">
                  <h3 className="col-heading">Педагогические принципы</h3>
                  <ul className="teacher-bullet-list">
                    {TEACHER_PROFILE.principles.map((item, idx) => (
                      <li key={idx} className="teacher-bullet-item">
                        <CheckCircle2 size={16} className="bullet-check" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            Section 5: Final Call to Action
            ========================================================================= */}
        <section className="section-final-cta" aria-labelledby="cta-title">
          <div className="landing-container">
            <div className="cta-banner">
              <h2 id="cta-title" className="cta-title">
                Готовы попробовать первое занятие?
              </h2>
              <p className="cta-lead">
                Три миссии первого урока уже открыты в интерактивной мастерской: прямой путь, обход каменной стены и отладка программы с ошибкой.
              </p>
              <div className="cta-buttons">
                <button
                  type="button"
                  className="btn-final-launch"
                  onClick={onGoToWorkshop}
                >
                  <span>Начать занятие: «Доставь робота к маяку»</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
              <span className="cta-footnote">
                Работает прямо в браузере. Данные сохраняются локально на этом компьютере.
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          Footer — Clean, Honest, With GitHub Repository Link
          ========================================================================= */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand-col">
            <div className="brand-lockup">
              <div className="brand-logo" aria-hidden="true">
                <Compass size={20} />
              </div>
              <div>
                <span className="brand-name">Робот и код</span>
                <span className="brand-tagline">Очный курс программирования для 4 класса</span>
              </div>
            </div>
            <p className="footer-author-text">
              Автор и разработчик: {TEACHER_PROFILE.name}, инженер и преподаватель C/C++.
            </p>
          </div>

          <div className="footer-links-col">
            <span className="footer-col-title">Навигация</span>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={onGoToWorkshop}
                >
                  Мастерская (Урок 1)
                </button>
              </li>
              <li><a href="#about" className="footer-link">О курсе</a></li>
              <li><a href="#method" className="footer-link">Методика обучения</a></li>
              <li><a href="#roadmap" className="footer-link">Маршрут курса</a></li>
              <li><a href="#teacher" className="footer-link">Преподаватель</a></li>
            </ul>
          </div>

          <div className="footer-source-col">
            <span className="footer-col-title">Исходный код</span>
            <p className="footer-source-desc">
              Открытый репозиторий проекта на GitHub.
            </p>
            <a
              href={TEACHER_PROFILE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="github-repo-link"
              title="Открыть репозиторий проекта на GitHub"
            >
              <Code2 size={16} aria-hidden="true" />
              <span>mrMoses2000/classes_moses</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="landing-container bottom-bar-inner">
            <span>© {new Date().getFullYear()} «Робот и код». Все права защищены.</span>
            <span>Без искусственных отзывов, рекламы и скрытых подписок.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
