/*
  Направляющие для Chrome DevTools
  https://github.com/KulSerHub/Chrome-DevTools-Guides

  Author:  Kulikov Serhii
  Website: https://kulser.com

  Приглашаю в мой Telegram-канал, где делюсь полезным:
  https://t.me/KulikovSerhiiChannel
*/

(() => {
  // Повторный запуск не должен плодить обработчики — удаляем прошлый экземпляр
  window.__guides?.destroy();

  const GRAB = 10; // сколько пикселей захватить с каждой стороны направляющей
  const COLOR = "#0ff"; // цвет направляющей
  const DOUBLE_ESC = 400; // макс. пауза между двумя Esc, мс
  const STORAGE_KEY = "__guides"; // ключ в localStorage

  // Прозрачный слой поверх всей страницы — контейнер для направляющих
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
  document.body.appendChild(layer);

  // Запоминает положение всех направляющих. Хранилище своё у каждого сайта,
  // а на служебных страницах недоступно — поэтому запись защищена
  const save = () => {
    const list = [...layer.children].map((g) =>
      [g.dataset.axis, parseFloat(g.dataset.axis === "x" ? g.style.left : g.style.top)]);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
  };

  // Рисует одну направляющую: вертикальную (задан x) или горизонтальную (задан y)
  const addGuide = (x, y) => {
    const isVertical = x !== null;

    // Прозрачная обёртка — зона захвата, отступы по GRAB с обеих сторон направляющей
    const guide = document.createElement("div");
    guide.dataset.axis = isVertical ? "x" : "y"; // ось нужна при сохранении
    guide.style.cssText = isVertical
      ? `position:fixed;top:0;bottom:0;left:${x}px;margin-left:${-GRAB}px;padding:0 ${GRAB}px;pointer-events:auto;cursor:ew-resize`
      : `position:fixed;left:0;right:0;top:${y}px;margin-top:${-GRAB}px;padding:${GRAB}px 0;pointer-events:auto;cursor:ns-resize`;

    // Видимая часть направляющей. Нарисована границей: браузер выравнивает границы
    // по пиксельной сетке, поэтому толщина остаётся ровно 1px на любом масштабе и зуме
    const line = document.createElement("div");
    line.style.cssText = isVertical
      ? `width:0;height:100%;border-right:1px solid ${COLOR}`
      : `width:100%;height:0;border-bottom:1px solid ${COLOR}`;
    guide.appendChild(line);

    // Тянем направляющую мышью; захват указателя не теряется при быстром движении
    guide.onpointerdown = (e) => {
      e.preventDefault();
      guide.setPointerCapture(e.pointerId);
      guide.onpointermove = (move) => {
        if (isVertical) guide.style.left = move.clientX + "px";
        else guide.style.top = move.clientY + "px";
      };
      // Конец перетаскивания: отпустили кнопку либо браузер забрал указатель себе
      guide.onpointerup = guide.onpointercancel = () => { guide.onpointermove = null; save(); };
    };

    guide.ondblclick = () => { guide.remove(); save(); }; // двойной клик по направляющей — убирает её
    layer.appendChild(guide);
    save();
  };

  // Следим за курсором, чтобы новая направляющая появлялась под ним
  let mouseX = 0, mouseY = 0, lastEsc = 0;
  const onMouseMove = (e) => { mouseX = e.clientX; mouseY = e.clientY; };

  const onKeyDown = (e) => {
    // В полях ввода клавиши V и H оставляем для текста, а не рисуем направляющие
    const el = e.target;
    if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;

    // Сочетания с модификаторами заняты браузером и страницей (Ctrl+V — вставка),
    // поэтому реагируем только на чистое нажатие. AltGraph — это правый Alt
    if (e.ctrlKey || e.metaKey || e.altKey || e.getModifierState("AltGraph")) return;

    if (e.code === "KeyV") addGuide(mouseX, null);
    else if (e.code === "KeyH") addGuide(null, mouseY);
    else if (e.code === "Escape") {
      // Двойное нажатие клавиши Esc подряд — убрать все направляющие
      const now = Date.now();
      if (now - lastEsc < DOUBLE_ESC) { layer.replaceChildren(); save(); }
      lastEsc = now;
    }
  };

  addEventListener("mousemove", onMouseMove);
  addEventListener("keydown", onKeyDown);

  // Ссылка для чистого перезапуска: снимает обработчики и убирает слой
  window.__guides = {
    destroy() {
      removeEventListener("mousemove", onMouseMove);
      removeEventListener("keydown", onKeyDown);
      layer.remove();
    },
  };

  // Возвращаем направляющие, сохранённые в прошлый раз на этом сайте
  try {
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      .forEach(([axis, pos]) => addGuide(axis === "x" ? pos : null, axis === "y" ? pos : null));
  } catch {}

  console.clear();
  console.log("\n\n%c📐 Направляющие для Chrome DevTools", "font-size:16px;font-weight:bold;color:#dc2626");
  console.log(`\n\n* Клавиши V и H добавляют вертикальные и горизонтальные направляющие\n* Направляющие можно передвигать мышью\n* Двойной клик по направляющей — убирает её\n* Двойное нажатие клавиши Esc — убирает все направляющие\n* Направляющие сохраняются для этого сайта и возвращаются при перезапуске\n\n `);
})();