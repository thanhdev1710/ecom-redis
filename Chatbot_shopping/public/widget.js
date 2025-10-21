(function(){
  var btn = document.getElementById('chatbot-widget-button');
  var box = document.getElementById('chatbot-container');
  var closeBtn = box.querySelector('.vh-chatbot-close');
  var messages = document.getElementById('chatbot-messages');
  var input = document.getElementById('chatbot-input');
  var sendBtn = document.getElementById('chatbot-send');
  var actionsBtn = document.getElementById('chatbot-actions');
  var actionMenu = document.getElementById('chatbot-action-menu');

  function appendMessage(text, cls){
    var wrap = document.createElement('div');
    wrap.className = 'vh-message ' + (cls ? ('vh-' + cls) : 'vh-bot');
    var content = document.createElement('div');
    content.className = 'vh-message-content';
    content.textContent = text;
    if (cls === 'bot' || !cls) {
      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '10px';
      row.style.alignItems = 'flex-start';
      var av = document.createElement('div');
      av.className = 'vh-bot-avatar';
      av.innerHTML = '<img src="/images/chatbot_1.png" alt="bot" />';
      row.appendChild(av);
      row.appendChild(content);
      wrap.appendChild(row);
    } else {
      wrap.appendChild(content);
    }
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function renderProductCard(p){
    var priceStr = typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + '₫' : (p.price || 'Liên hệ');

    var card = document.createElement('div');
    card.setAttribute('data-slot','card');
    card.className = 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm group overflow-hidden border-border hover:shadow-lg transition-shadow duration-300 pt-0';

    var aTop = document.createElement('a');
    aTop.href = '/products/' + (p.id || '');
    var imgWrap = document.createElement('div');
    imgWrap.className = 'relative aspect-square overflow-hidden bg-muted cursor-pointer border-b-2';
    var img = document.createElement('img');
    img.alt = p.name || 'Sản phẩm';
    img.loading = 'lazy';
    img.width = 300; img.height = 400; img.decoding = 'async';
    img.className = 'object-cover w-full h-full';
    var rawSrc = p.image || '';
    var isAbs = /^https?:\/\//i.test(rawSrc);
    var isRootRel = /^\//.test(rawSrc);
    if (isAbs) {
      try {
        var u = new URL(rawSrc);
        // ALWAYS rebase absolute image URLs to current site origin (port 3000)
        img.src = window.location.origin + u.pathname + (u.search || "");
      } catch (_) {
        img.src = rawSrc;
      }
    } else if (isRootRel) {
      img.src = window.location.origin + rawSrc;
    } else {
      img.src = rawSrc || 'https://via.placeholder.com/400x400?text=Product';
    }
    imgWrap.appendChild(img);
    aTop.appendChild(imgWrap);
    card.appendChild(aTop);

    var content = document.createElement('div');
    content.setAttribute('data-slot','card-content');
    content.className = 'p-4';
    var aTitle = document.createElement('a');
    aTitle.href = '/products/' + (p.id || '');
    var titleRow = document.createElement('div');
    titleRow.className = 'flex items-start justify-between gap-2 mb-2';
    var h3 = document.createElement('h3');
    h3.className = 'font-medium text-base leading-tight line-clamp-2 hover:text-primary transition-colors';
    h3.textContent = p.name || 'Sản phẩm';
    titleRow.appendChild(h3);
    aTitle.appendChild(titleRow);
    content.appendChild(aTitle);

    var brand = document.createElement('p');
    brand.className = 'text-sm text-muted-foreground mb-2';
    brand.textContent = p.brand || '';
    content.appendChild(brand);

    var metaRow = document.createElement('div');
    metaRow.className = 'flex items-center gap-2 mb-3';
    var rateWrap = document.createElement('div'); rateWrap.className = 'flex items-center gap-1';
    var star = document.createElementNS('http://www.w3.org/2000/svg','svg');
    star.setAttribute('xmlns','http://www.w3.org/2000/svg'); star.setAttribute('viewBox','0 0 24 24');
    star.setAttribute('fill','currentColor'); star.classList.add('h-4','w-4');
    var path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d','M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z');
    star.appendChild(path);
    rateWrap.appendChild(star);
    var rateText = document.createElement('span'); rateText.className = 'text-sm font-medium'; rateText.textContent = (p.ratingAvg || '').toString();
    rateWrap.appendChild(rateText);
    metaRow.appendChild(rateWrap);
    var sold = document.createElement('span'); sold.className = 'text-sm text-muted-foreground'; sold.textContent = p.sold ? ('Đã bán ' + p.sold) : '';
    metaRow.appendChild(sold);
    content.appendChild(metaRow);

    var price = document.createElement('p');
    price.className = 'text-xl font-semibold text-primary';
    price.textContent = priceStr;
    content.appendChild(price);
    card.appendChild(content);

    // footer button removed per request

    var wrap = document.createElement('div');
    wrap.className = 'vh-message vh-bot';
    var row = document.createElement('div');
    row.style.display = 'flex'; row.style.gap = '10px'; row.style.alignItems = 'flex-start';
    var av = document.createElement('div'); av.className = 'vh-bot-avatar'; av.innerHTML = '<img src="/images/chatbot_1.png" alt="bot" />';
    row.appendChild(av); row.appendChild(card); wrap.appendChild(row);
    messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
  }

  function renderQuickReplies(qr){
    if (!qr || !qr.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'vh-message vh-bot';
    var row = document.createElement('div');
    row.style.display = 'flex'; row.style.gap = '10px'; row.style.alignItems = 'flex-start';
    var av = document.createElement('div'); av.className = 'vh-bot-avatar'; av.innerHTML = '<img src="/images/chatbot_1.png" alt="bot" />';
    var col = document.createElement('div');
    qr.forEach(function(q){
      var b = document.createElement(q.url ? 'a' : 'button');
      b.className = 'vh-product-link';
      var label = q.text || q.payload || 'Chọn';
      if (q.url) { b.href = q.url; b.target = '_blank'; }
      b.textContent = label;
      if (q.payload) b.title = q.payload; // show payload as tooltip for clarity
      b.style.marginTop = '8px';
      if (!q.url) {
        b.addEventListener('click', function(){ 
          var messageToSend = q.payload || label;
          sendMessageDirect(messageToSend);
        });
      }
      col.appendChild(b);
    });
    row.appendChild(av); row.appendChild(col); wrap.appendChild(row);
    messages.appendChild(wrap); messages.scrollTop = messages.scrollHeight;
  }

  function renderProductList(items){
    if (!Array.isArray(items) || items.length === 0) return;
    items.forEach(function(p){ renderProductCard(p); });
  }

  actionsBtn.addEventListener('click', function(){
    var btnRect = actionsBtn.getBoundingClientRect();
    var boxRect = box.getBoundingClientRect();
    var left = Math.max(12, btnRect.left - boxRect.left);
    actionMenu.style.left = left + 'px';
    actionMenu.style.display = actionMenu.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', function(e){
    var within = actionMenu.contains(e.target) || actionsBtn.contains(e.target);
    if (!within) actionMenu.style.display = 'none';
  });

  function showTyping(){
    var t = document.createElement('div');
    t.className = 'vh-message vh-bot';
    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.alignItems = 'flex-start';
    var av = document.createElement('div');
    av.className = 'vh-bot-avatar';
    av.innerHTML = '<img src="/images/chatbot_1.png" alt="bot" />';
    var dots = document.createElement('div');
    dots.className = 'vh-typing-indicator';
    dots.innerHTML = '<span></span><span></span><span></span>';
    row.appendChild(av);
    row.appendChild(dots);
    t.appendChild(row);
    messages.appendChild(t);
  messages.scrollTop = messages.scrollHeight;
    return t;
  }

  var userId = 'user_' + Math.random().toString(36).slice(2, 11);
  if (!localStorage.getItem('chatbot_userId')) {
    localStorage.setItem('chatbot_userId', userId);
  } else {
    userId = localStorage.getItem('chatbot_userId');
  }

  async function sendMessage(){
    var text = (input.value || '').trim();
    if (!text) return;
    appendMessage(text, 'user');
    input.value = '';
    await sendMessageDirect(text);
  }

  async function sendMessageDirect(text){
    var typingEl = showTyping();
    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId: userId })
      });
      var data = await res.json();
      typingEl.remove();
      if (!data || data.ok !== true) {
        appendMessage('Lỗi server, vui lòng thử lại sau.');
      return;
    }
      var r = data.reply || {};
      if (r.type === 'product' && r.product) {
        renderProductCard(r.product);
        renderQuickReplies(r.quickReplies || []);
      } else if (r.type === 'link' && r.url) {
        appendMessage(r.text || 'Vui lòng truy cập liên kết bên dưới');
        renderQuickReplies([{ text: 'Mở form báo giá', url: r.url }]);
      } else if (r.type === 'text' && r.text) {
        appendMessage(r.text);
        if (Array.isArray(r.items)) renderProductList(r.items);
        renderQuickReplies(r.quickReplies || []);
    } else {
        appendMessage('Mình chưa tìm thấy phản hồi phù hợp.');
    }
  } catch (e) {
      typingEl.remove();
      appendMessage('Lỗi kết nối, vui lòng thử lại.');
    }
  }

  btn.addEventListener('click', function(){
    var opening = box.style.display === 'none';
    box.style.display = opening ? 'flex' : 'none';
    // Auto greet on first open if empty
    if (opening && messages.childElementCount === 0) {
      sendMessageDirect('xin chào');
    }
  });
  closeBtn.addEventListener('click', function(){ box.style.display = 'none'; });
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function(e){ if (e.key === 'Enter') sendMessage(); });
})();