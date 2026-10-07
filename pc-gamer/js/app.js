/**
 * NavDoc Web Standalone Engine — Client Application
 * Compativel com GitHub Pages e execucao offline direta via file:// ou http(s)://
 */

(function () {
  'use strict';

  // ==========================================
  // Estado da Aplicacao
  // ==========================================
  var state = {
    course: window.COURSE_DATA || null,
    currentChapterIndex: 0,
    currentLessonIndex: 0,
    currentSlideIndex: 0,
    currentSlidesList: [],
    completedLessons: new Set(JSON.parse(localStorage.getItem('navdoc_completed_lessons') || '[]')),
    searchQuery: '',
    theme: localStorage.getItem('navdoc_theme') || 'dark',
  };

  // Elementos do DOM
  var elements = {
    btnToggleSidebar: document.getElementById('btnToggleSidebar'),
    sidebar: document.getElementById('sidebar'),
    sidebarNav: document.getElementById('sidebarNav'),
    sidebarStatsText: document.getElementById('sidebarStatsText'),
    lessonSearchInput: document.getElementById('lessonSearchInput'),
    btnClearSearch: document.getElementById('btnClearSearch'),
    topCourseTitle: document.getElementById('topCourseTitle'),
    breadcrumbs: document.getElementById('breadcrumbs'),
    overallProgressBar: document.getElementById('overallProgressBar'),
    overallProgressText: document.getElementById('overallProgressText'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),
    articleContent: document.getElementById('articleContent'),
    lessonActionToolbar: document.getElementById('lessonActionToolbar'),
    lessonChapterBadge: document.getElementById('lessonChapterBadge'),
    lessonReadingTime: document.getElementById('lessonReadingTime'),
    btnOpenPresentation: document.getElementById('btnOpenPresentation'),
    btnOpenQuiz: document.getElementById('btnOpenQuiz'),
    lessonFooterNav: document.getElementById('lessonFooterNav'),
    btnPrevLesson: document.getElementById('btnPrevLesson'),
    btnNextLesson: document.getElementById('btnNextLesson'),
    prevLessonTitle: document.getElementById('prevLessonTitle'),
    nextLessonTitle: document.getElementById('nextLessonTitle'),
    btnToggleComplete: document.getElementById('btnToggleComplete'),
    btnToggleCompleteText: document.getElementById('btnToggleCompleteText'),

    // Modais
    slidesModal: document.getElementById('slidesModal'),
    slidesModalTitle: document.getElementById('slidesModalTitle'),
    slidesCounter: document.getElementById('slidesCounter'),
    slidesBody: document.getElementById('slidesBody'),
    slideDots: document.getElementById('slideDots'),
    btnPrevSlide: document.getElementById('btnPrevSlide'),
    btnNextSlide: document.getElementById('btnNextSlide'),
    btnCloseSlides: document.getElementById('btnCloseSlides'),

    quizModal: document.getElementById('quizModal'),
    quizForm: document.getElementById('quizForm'),
    quizQuestionsContainer: document.getElementById('quizQuestionsContainer'),
    btnSubmitQuiz: document.getElementById('btnSubmitQuiz'),
    btnResetQuiz: document.getElementById('btnResetQuiz'),
    quizScoreBanner: document.getElementById('quizScoreBanner'),
    quizScorePercent: document.getElementById('quizScorePercent'),
    quizScoreHeadline: document.getElementById('quizScoreHeadline'),
    quizScoreMessage: document.getElementById('quizScoreMessage'),
    btnCloseQuiz: document.getElementById('btnCloseQuiz'),
  };

  // ==========================================
  // Parser Markdown Embutido Leve & Seguro
  // ==========================================
  function parseMarkdown(md) {
    if (!md) return '';

    // Remove YAML frontmatter
    var text = md.replace(/^---[\s\S]*?---\n*/m, '');

    // Remove tags ocultas de quiz/apresentacao
    text = text.replace(/<section class="interactive-presentation" hidden>[\s\S]*?<\/section>/g, '');
    text = text.replace(/<section class="interactive-quiz" hidden>[\s\S]*?<\/section>/g, '');

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Tratar Blocos de Codigo
    var codeBlocks = [];
    text = text.replace(/(?:\x60\x60\x60\x60|\x60\x60\x60)([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:\x60\x60\x60\x60|\x60\x60\x60)/g, function(match, lang, code) {
      var id = '___CODE_BLOCK_' + codeBlocks.length + '___';
      codeBlocks.push({ lang: lang || 'text', code: escapeHtml(code.trim()) });
      return id;
    });

    // Tratar Desafio Pratico
    text = text.replace(/##\s+Desafio pr[aá]tico\n([\s\S]*?)(?=\n##|$)/gi, function(match, content) {
      return '<aside class="practice-challenge-card"><h2>🎯 Desafio Prático</h2>\n' + content + '</aside>\n';
    });

    // Headers
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    text = text.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Imagens: normalizar caminhos ../images/ para images/
    text = text.replace(/!\[([^\]]*)\]\((?:\.\.\/)*images\/([^\)]+)\)/gi, '<img src="./images/$2" alt="$1" loading="lazy" />');
    text = text.replace(/!\[([^\]]*)\]\(([^\)]+)\)/gi, '<img src="$2" alt="$1" loading="lazy" />');

    // Links
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/gi, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Bold & Italics
    text = text.replace(/\*\*([^\*]+)\*\*/gi, '<strong>$1</strong>');
    text = text.replace(/\*([^\*]+)\*/gi, '<em>$1</em>');
    text = text.replace(/_([^_]+)_/gi, '<em>$1</em>');

    // Inline Code
    text = text.replace(/\x60([^\x60]+)\x60/gi, '<code>$1</code>');

    // Tabelas simples
    text = text.replace(/\|(.+)\|\n\|[-:\| ]+\|\n((?:\|.+\|\n?)+)/g, function(match, header, body) {
      var ths = header.split('|').map(function(s) { return s.trim(); }).filter(Boolean).map(function(h) { return '<th>' + h + '</th>'; }).join('');
      var rows = body.trim().split('\n').map(function(row) {
        var tds = row.split('|').map(function(s) { return s.trim(); }).filter(Boolean).map(function(d) { return '<td>' + d + '</td>'; }).join('');
        return '<tr>' + tds + '</tr>';
      }).join('');
      return '<table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table>';
    });

    // Listas
    text = text.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>\n?)+/gi, '<ul>$&</ul>');

    // Paragrafos
    var paragraphs = text.split(/\n{2,}/);
    text = paragraphs.map(function(p) {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<table') || p.startsWith('<blockquote') || p.startsWith('<aside') || p.startsWith('___CODE_BLOCK_')) {
        return p;
      }
      return '<p>' + p.replace(/\n/g, '<br />') + '</p>';
    }).join('\n');

    // Restaurar blocos de codigo
    codeBlocks.forEach(function(block, idx) {
      var placeholder = '___CODE_BLOCK_' + idx + '___';
      var replacement = '<pre><button class="code-copy-btn" type="button">Copiar</button><code class="language-' + block.lang + '">' + block.code + '</code></pre>';
      text = text.replace(placeholder, replacement);
    });

    return text;
  }

  // ==========================================
  // Inicializacao & Tema
  // ==========================================
  function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    if (state.theme === 'light') {
      elements.themeIconSun.classList.remove('hidden');
      elements.themeIconMoon.classList.add('hidden');
    } else {
      elements.themeIconSun.classList.add('hidden');
      elements.themeIconMoon.classList.remove('hidden');
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('navdoc_theme', state.theme);
    initTheme();
  }

  // ==========================================
  // Renderizacao da Sidebar e Progresso
  // ==========================================
  function updateOverallProgress() {
    if (!state.course) return;
    var totalLessons = 0;
    state.course.chapters.forEach(function(c) { totalLessons += c.lessons.length; });
    if (totalLessons === 0) return;

    var completed = state.completedLessons.size;
    var pct = Math.round((completed / totalLessons) * 100);
    elements.overallProgressBar.style.width = pct + '%';
    elements.overallProgressText.textContent = pct + '%';
  }

  function renderSidebar() {
    if (!state.course) return;

    elements.topCourseTitle.textContent = state.course.title;
    elements.sidebarStatsText.textContent = state.course.totalChapters + ' Capítulos • ' + state.course.totalLessons + ' Lições';

    var q = state.searchQuery.toLowerCase().trim();
    var html = '';

    state.course.chapters.forEach(function(chapter, chIdx) {
      var filteredLessons = chapter.lessons.filter(function(l) {
        if (!q) return true;
        return l.title.toLowerCase().includes(q) || (l.markdown && l.markdown.toLowerCase().includes(q));
      });

      if (filteredLessons.length === 0 && q) return;

      var isChapterActive = state.currentChapterIndex === chIdx;

      html += '<div class="chapter-group ' + (isChapterActive ? '' : 'collapsed') + '" data-chapter-index="' + chIdx + '">';
      html += '  <div class="chapter-header" data-toggle-chapter="' + chIdx + '">';
      html += '    <span>' + chapter.order + '. ' + chapter.title + '</span>';
      html += '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
      html += '  </div>';
      html += '  <ul class="lesson-list">';

      chapter.lessons.forEach(function(lesson, lIdx) {
        if (q && !filteredLessons.includes(lesson)) return;

        var isLessonActive = state.currentChapterIndex === chIdx && state.currentLessonIndex === lIdx;
        var lessonKey = 'ch' + chIdx + '_l' + lIdx;
        var isCompleted = state.completedLessons.has(lessonKey);

        html += '<li>';
        html += '  <a href="#ch' + chIdx + '_l' + lIdx + '" class="lesson-item-link ' + (isLessonActive ? 'active' : '') + ' ' + (isCompleted ? 'completed' : '') + '" data-ch="' + chIdx + '" data-l="' + lIdx + '">';
        html += '    <span class="lesson-title-text">' + lesson.order + '. ' + lesson.title + '</span>';
        html += '    <span class="lesson-badges">';
        if (lesson.hasPresentation) html += '<span class="badge-pill" title="Possui Apresentação em Slides">📽️</span>';
        if (lesson.hasQuiz) html += '<span class="badge-pill" title="Possui Quiz Interativo">📝</span>';
        html += '    </span>';
        html += '  </a>';
        html += '</li>';
      });

      html += '  </ul>';
      html += '</div>';
    });

    elements.sidebarNav.innerHTML = html;

    // Listeners de abertura de capitulos
    elements.sidebarNav.querySelectorAll('[data-toggle-chapter]').forEach(function(header) {
      header.addEventListener('click', function() {
        var group = header.closest('.chapter-group');
        group.classList.toggle('collapsed');
      });
    });

    // Listeners de clique nas licoes
    elements.sidebarNav.querySelectorAll('.lesson-item-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var ch = parseInt(link.dataset.ch, 10);
        var l = parseInt(link.dataset.l, 10);
        loadLesson(ch, l);
      });
    });
  }

  // ==========================================
  // Carregamento de Licao
  // ==========================================
  function loadLesson(chapterIndex, lessonIndex) {
    if (!state.course || !state.course.chapters[chapterIndex]) return;
    var chapter = state.course.chapters[chapterIndex];
    var lesson = chapter.lessons[lessonIndex];
    if (!lesson) return;

    state.currentChapterIndex = chapterIndex;
    state.currentLessonIndex = lessonIndex;
    window.location.hash = 'ch' + chapterIndex + '_l' + lessonIndex;

    // Atualizar Breadcrumbs
    elements.breadcrumbs.innerHTML = '<span class="crumb-chapter">' + chapter.order + '. ' + chapter.title + '</span>' +
      '<span class="crumb-separator">/</span>' +
      '<span class="crumb-lesson">' + lesson.order + '. ' + lesson.title + '</span>';

    // Atualizar Barra de Acoes Rapidas
    elements.lessonChapterBadge.textContent = 'Capítulo ' + chapter.order;
    var wordMatch = lesson.markdown.match(/\p{L}+/gu);
    var wordCount = wordMatch ? wordMatch.length : 0;
    var readMin = Math.max(1, Math.ceil(wordCount / 180));
    elements.lessonReadingTime.textContent = '⏱️ ~' + readMin + ' min de leitura (' + wordCount.toLocaleString() + ' palavras)';

    if (lesson.hasPresentation && lesson.slides && lesson.slides.length > 0) {
      elements.btnOpenPresentation.classList.remove('hidden');
    } else {
      elements.btnOpenPresentation.classList.add('hidden');
    }

    if (lesson.hasQuiz && lesson.quiz && lesson.quiz.length > 0) {
      elements.btnOpenQuiz.classList.remove('hidden');
    } else {
      elements.btnOpenQuiz.classList.add('hidden');
    }

    elements.lessonActionToolbar.classList.remove('hidden');

    // Renderizar Artigo Markdown
    elements.articleContent.innerHTML = parseMarkdown(lesson.markdown);

    // Configurar botoes de copiar codigo
    elements.articleContent.querySelectorAll('.code-copy-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var code = btn.nextElementSibling ? btn.nextElementSibling.textContent || '' : '';
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copiado!';
          setTimeout(function() { btn.textContent = 'Copiar'; }, 1500);
        } catch (err) {
          btn.textContent = 'Erro ao copiar';
        }
      });
    });

    // Atualizar Navegacao Inferior
    updateLessonFooterNav();

    // Re-renderizar sidebar para refletir item ativo
    renderSidebar();

    // Rolar para o topo da area de leitura
    var contentEl = document.getElementById('contentArea');
    if (contentEl) contentEl.scrollTop = 0;
  }

  function updateLessonFooterNav() {
    var chapter = state.course.chapters[state.currentChapterIndex];
    elements.lessonFooterNav.classList.remove('hidden');

    // Licao Anterior
    var prevCh = state.currentChapterIndex;
    var prevL = state.currentLessonIndex - 1;
    if (prevL < 0) {
      prevCh -= 1;
      if (prevCh >= 0) {
        prevL = state.course.chapters[prevCh].lessons.length - 1;
      }
    }

    if (prevCh >= 0 && prevL >= 0) {
      elements.btnPrevLesson.style.visibility = 'visible';
      elements.prevLessonTitle.textContent = state.course.chapters[prevCh].lessons[prevL].title;
    } else {
      elements.btnPrevLesson.style.visibility = 'hidden';
    }

    // Proxima Licao
    var nextCh = state.currentChapterIndex;
    var nextL = state.currentLessonIndex + 1;
    if (nextL >= chapter.lessons.length) {
      nextCh += 1;
      nextL = 0;
    }

    if (nextCh < state.course.chapters.length && nextL < state.course.chapters[nextCh].lessons.length) {
      elements.btnNextLesson.style.visibility = 'visible';
      elements.nextLessonTitle.textContent = state.course.chapters[nextCh].lessons[nextL].title;
    } else {
      elements.btnNextLesson.style.visibility = 'hidden';
    }

    // Botao Concluir
    var lessonKey = 'ch' + state.currentChapterIndex + '_l' + state.currentLessonIndex;
    var isCompleted = state.completedLessons.has(lessonKey);
    if (isCompleted) {
      elements.btnToggleComplete.classList.add('is-completed');
      elements.btnToggleCompleteText.textContent = 'Lição Concluída ✓';
    } else {
      elements.btnToggleComplete.classList.remove('is-completed');
      elements.btnToggleCompleteText.textContent = 'Concluir Lição';
    }
  }

  // ==========================================
  // Motor de Apresentacao (Slides)
  // ==========================================
  function openPresentationModal() {
    var chapter = state.course.chapters[state.currentChapterIndex];
    var lesson = chapter.lessons[state.currentLessonIndex];
    if (!lesson || !lesson.slides || lesson.slides.length === 0) return;

    state.currentSlidesList = lesson.slides;
    state.currentSlideIndex = 0;
    renderCurrentSlide();
    elements.slidesModal.classList.remove('hidden');
  }

  function renderCurrentSlide() {
    var total = state.currentSlidesList.length;
    var slide = state.currentSlidesList[state.currentSlideIndex];
    if (!slide) return;

    elements.slidesCounter.textContent = (state.currentSlideIndex + 1) + ' / ' + total;
    elements.slidesModalTitle.textContent = slide.title || ('Slide ' + (state.currentSlideIndex + 1));

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    var html = '<h3>' + escapeHtml(slide.title || '') + '</h3>';

    if (slide.exportImagePath) {
      var imgPath = slide.exportImagePath.replace(/^(?:\.\.\/)*assets\/images\/|^images\//, './images/');
      html += '<img src="' + imgPath + '" alt="' + escapeHtml(slide.title || 'Slide Image') + '" />';
    }

    if (slide.bulletPoints && slide.bulletPoints.length > 0) {
      html += '<ul>';
      slide.bulletPoints.forEach(function(bp) {
        html += '<li>' + escapeHtml(bp) + '</li>';
      });
      html += '</ul>';
    }

    if (slide.narrationScript) {
      html += '<div class="slide-narration-box">🎙️ <strong>Notas do apresentador:</strong> ' + escapeHtml(slide.narrationScript) + '</div>';
    }

    elements.slidesBody.innerHTML = html;

    // Dots
    var dotsHtml = '';
    for (var i = 0; i < total; i++) {
      dotsHtml += '<span class="slide-dot ' + (i === state.currentSlideIndex ? 'active' : '') + '"></span>';
    }
    elements.slideDots.innerHTML = dotsHtml;

    elements.btnPrevSlide.disabled = state.currentSlideIndex === 0;
    elements.btnNextSlide.disabled = state.currentSlideIndex === total - 1;
  }

  function nextSlide() {
    if (state.currentSlideIndex < state.currentSlidesList.length - 1) {
      state.currentSlideIndex++;
      renderCurrentSlide();
    }
  }

  function prevSlide() {
    if (state.currentSlideIndex > 0) {
      state.currentSlideIndex--;
      renderCurrentSlide();
    }
  }

  // ==========================================
  // Motor do Quiz Interativo
  // ==========================================
  function openQuizModal() {
    var chapter = state.course.chapters[state.currentChapterIndex];
    var lesson = chapter.lessons[state.currentLessonIndex];
    if (!lesson || !lesson.quiz || lesson.quiz.length === 0) return;

    elements.quizModalTitle.textContent = 'Quiz: ' + lesson.title;
    elements.quizScoreBanner.classList.add('hidden');
    elements.btnResetQuiz.classList.add('hidden');
    elements.btnSubmitQuiz.disabled = false;
    elements.btnSubmitQuiz.classList.remove('hidden');

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    var html = '';
    lesson.quiz.forEach(function(q, qIdx) {
      var correctIdx = typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0;
      var metaBits = [];
      if (q.difficulty) metaBits.push('Dificuldade: ' + q.difficulty);
      if (q.bloomLevel) metaBits.push('Bloom: ' + q.bloomLevel);

      html += '<div class="quiz-question-card" data-q-index="' + qIdx + '" data-correct="' + correctIdx + '">';
      html += '  <div class="quiz-question-header">';
      html += '    <span class="quiz-question-num">Questão ' + (qIdx + 1) + ' de ' + lesson.quiz.length + '</span>';
      html += '    <span class="quiz-question-meta">' + escapeHtml(metaBits.join(' • ')) + '</span>';
      html += '  </div>';
      html += '  <p class="quiz-question-text">' + escapeHtml(q.question) + '</p>';
      html += '  <div class="quiz-options-list">';

      (q.options || []).forEach(function(opt, optIdx) {
        html += '    <label class="quiz-option-label" data-opt-index="' + optIdx + '">';
        html += '      <input type="radio" name="quiz_q_' + qIdx + '" value="' + optIdx + '" required />';
        html += '      <span>' + escapeHtml(opt) + '</span>';
        html += '    </label>';
      });

      html += '  </div>';
      html += '  <div class="quiz-explanation-box hidden">';
      html += '    💡 <strong>Explicação:</strong> ' + escapeHtml(q.explanation || 'Opção correta.') + '';
      html += '  </div>';
      html += '</div>';
    });

    elements.quizQuestionsContainer.innerHTML = html;
    elements.quizModal.classList.remove('hidden');
  }

  function handleQuizSubmit(e) {
    e.preventDefault();
    var chapter = state.course.chapters[state.currentChapterIndex];
    var lesson = chapter.lessons[state.currentLessonIndex];
    if (!lesson || !lesson.quiz) return;

    var cards = elements.quizQuestionsContainer.querySelectorAll('.quiz-question-card');
    var correctCount = 0;
    var total = cards.length;

    cards.forEach(function(card) {
      var correctIndex = parseInt(card.dataset.correct, 10);
      var selected = card.querySelector('input[type="radio"]:checked');
      var selectedValue = selected ? parseInt(selected.value, 10) : -1;
      var explanation = card.querySelector('.quiz-explanation-box');

      card.querySelectorAll('input[type="radio"]').forEach(function(inp) { inp.disabled = true; });

      if (selectedValue === correctIndex) {
        correctCount++;
        card.classList.add('correct');
        card.classList.remove('incorrect');
      } else {
        card.classList.add('incorrect');
        card.classList.remove('correct');
      }

      // Destacar alternativa correta
      var correctLabel = card.querySelector('[data-opt-index="' + correctIndex + '"]');
      if (correctLabel) correctLabel.classList.add('is-correct-choice');

      if (explanation) explanation.classList.remove('hidden');
    });

    var pct = Math.round((correctCount / total) * 100);
    elements.quizScorePercent.textContent = pct + '%';
    elements.quizScoreHeadline.textContent = pct >= 70 ? '🎉 Excelente Desempenho!' : '📖 Vale Revisar o Conteúdo!';
    elements.quizScoreMessage.textContent = 'Você acertou ' + correctCount + ' de ' + total + ' questões (' + pct + '% de aproveitamento).';

    elements.quizScoreBanner.classList.remove('hidden');
    elements.btnSubmitQuiz.classList.add('hidden');
    elements.btnResetQuiz.classList.remove('hidden');

    // Se acertou pelo menos 70%, marca licao como concluida automaticamente
    if (pct >= 70) {
      var lessonKey = 'ch' + state.currentChapterIndex + '_l' + state.currentLessonIndex;
      state.completedLessons.add(lessonKey);
      localStorage.setItem('navdoc_completed_lessons', JSON.stringify(Array.from(state.completedLessons)));
      updateOverallProgress();
      updateLessonFooterNav();
      renderSidebar();
    }
  }

  function resetQuiz() {
    openQuizModal();
  }

  // ==========================================
  // Utilitarios & Listeners Globais
  // ==========================================
  function setupEventListeners() {
    // Alternar menu lateral
    elements.btnToggleSidebar.addEventListener('click', function() {
      elements.sidebar.classList.toggle('collapsed');
    });

    // Tema
    elements.btnThemeToggle.addEventListener('click', toggleTheme);

    // Busca
    elements.lessonSearchInput.addEventListener('input', function(e) {
      state.searchQuery = e.target.value;
      elements.btnClearSearch.classList.toggle('hidden', !state.searchQuery);
      renderSidebar();
    });

    elements.btnClearSearch.addEventListener('click', function() {
      state.searchQuery = '';
      elements.lessonSearchInput.value = '';
      elements.btnClearSearch.classList.add('hidden');
      renderSidebar();
    });

    // Concluir licao
    elements.btnToggleComplete.addEventListener('click', function() {
      var lessonKey = 'ch' + state.currentChapterIndex + '_l' + state.currentLessonIndex;
      if (state.completedLessons.has(lessonKey)) {
        state.completedLessons.delete(lessonKey);
      } else {
        state.completedLessons.add(lessonKey);
      }
      localStorage.setItem('navdoc_completed_lessons', JSON.stringify(Array.from(state.completedLessons)));
      updateOverallProgress();
      updateLessonFooterNav();
      renderSidebar();
    });

    // Navegacao anterior / proxima licao
    elements.btnPrevLesson.addEventListener('click', function() {
      var prevCh = state.currentChapterIndex;
      var prevL = state.currentLessonIndex - 1;
      if (prevL < 0) {
        prevCh -= 1;
        if (prevCh >= 0) {
          prevL = state.course.chapters[prevCh].lessons.length - 1;
        }
      }
      if (prevCh >= 0 && prevL >= 0) loadLesson(prevCh, prevL);
    });

    elements.btnNextLesson.addEventListener('click', function() {
      var chapter = state.course.chapters[state.currentChapterIndex];
      var nextCh = state.currentChapterIndex;
      var nextL = state.currentLessonIndex + 1;
      if (nextL >= chapter.lessons.length) {
        nextCh += 1;
        nextL = 0;
      }
      if (nextCh < state.course.chapters.length && nextL < state.course.chapters[nextCh].lessons.length) {
        loadLesson(nextCh, nextL);
      }
    });

    // Apresentacao
    elements.btnOpenPresentation.addEventListener('click', openPresentationModal);
    elements.btnCloseSlides.addEventListener('click', function() { elements.slidesModal.classList.add('hidden'); });
    elements.btnPrevSlide.addEventListener('click', prevSlide);
    elements.btnNextSlide.addEventListener('click', nextSlide);

    // Quiz
    elements.btnOpenQuiz.addEventListener('click', openQuizModal);
    elements.btnCloseQuiz.addEventListener('click', function() { elements.quizModal.classList.add('hidden'); });
    elements.quizForm.addEventListener('submit', handleQuizSubmit);
    elements.btnResetQuiz.addEventListener('click', resetQuiz);

    // Fechar modais ao clicar no backdrop
    elements.slidesModal.addEventListener('click', function(e) {
      if (e.target === elements.slidesModal) elements.slidesModal.classList.add('hidden');
    });
    elements.quizModal.addEventListener('click', function(e) {
      if (e.target === elements.quizModal) elements.quizModal.classList.add('hidden');
    });

    // Atalhos de teclado
    window.addEventListener('keydown', function(e) {
      if (!elements.slidesModal.classList.contains('hidden')) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          nextSlide();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevSlide();
        } else if (e.key === 'Escape') {
          elements.slidesModal.classList.add('hidden');
        }
      } else if (!elements.quizModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          elements.quizModal.classList.add('hidden');
        }
      }
    });

    // Hash change na URL (navegacao pelo historico)
    window.addEventListener('hashchange', function() {
      handleHashNavigation();
    });
  }

  function handleHashNavigation() {
    var hash = window.location.hash.replace('#', '');
    var match = hash.match(/^ch(\d+)_l(\d+)$/);
    if (match) {
      var ch = parseInt(match[1], 10);
      var l = parseInt(match[2], 10);
      if (state.course && state.course.chapters[ch] && state.course.chapters[ch].lessons[l]) {
        loadLesson(ch, l);
      }
    }
  }

  // ==========================================
  // Inicializacao Geral
  // ==========================================
  function init() {
    initTheme();
    setupEventListeners();

    if (!state.course) {
      elements.articleContent.innerHTML = '<div class="welcome-screen"><h2>Nenhum dado de curso encontrado.</h2><p>Certifique-se de que <code>course-data.js</code> foi carregado corretamente.</p></div>';
      return;
    }

    renderSidebar();
    updateOverallProgress();

    // Carregar Licao Inicial (por hash ou a primeira)
    var hash = window.location.hash.replace('#', '');
    var match = hash.match(/^ch(\d+)_l(\d+)$/);
    if (match) {
      var ch = parseInt(match[1], 10);
      var l = parseInt(match[2], 10);
      loadLesson(ch, l);
    } else if (state.course.chapters.length > 0 && state.course.chapters[0].lessons.length > 0) {
      loadLesson(0, 0);
    }
  }

  // Iniciar apos carregar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
