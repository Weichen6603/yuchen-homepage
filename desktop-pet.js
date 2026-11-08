/* Little Yuchen / V38. Vanilla JS, no network, tracking, audio, or dependencies. */
(() => {
  'use strict';
  const init = () => {
    const pet = document.getElementById('little-yuchen');
    if (!pet) return;
    const character = pet.querySelector('.pet-character');
    const dialog = pet.querySelector('.pet-dialog');
    const title = pet.querySelector('#pet-dialog-title');
    const copy = pet.querySelector('#pet-dialog-copy');
    const primary = pet.querySelector('.pet-primary');
    const secondary = pet.querySelector('.pet-secondary');
    const hud = pet.querySelector('.pet-hud');
    const score = pet.querySelector('.pet-score');
    const layer = document.getElementById('pet-game-layer');
    const effects = document.getElementById('pet-effects');
    const announcer = document.getElementById('pet-announcer');
    const wake = document.getElementById('pet-wake');
    const sidebarSlot = document.getElementById('pet-sidebar-slot');
    const profile = document.querySelector('.profile');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = matchMedia('(max-width: 650px)');
    const TOTAL = 5;
    const colors = ['#d5b4c4', '#bdcfa7', '#edc987', '#bcb3dd', '#afd0d4'];
    let state = 'dormant';
    let caught = new Set();
    let occupied = [];
    let repositionTimer = 0;
    let shotTimer = 0;
    let winTimer = 0;
    let isTransitioning = false;
    let session = 0;
    let restoreFocus = null;
    const setState = next => { state = next; pet.dataset.state = next; };
    const say = text => { announcer.textContent = text; };
    const isVisible = rect => rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    const rect = (x, y, w, h) => ({left:x, top:y, right:x+w, bottom:y+h, width:w, height:h});
    const expanded = (r, p=8) => ({left:r.left-p, top:r.top-p, right:r.right+p, bottom:r.bottom+p});
    const intersects = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const size = () => mobile.matches ? 44 : 40;

    function positionDialog() {
      if (dialog.hidden) return;
      const r = character.getBoundingClientRect();
      const h = dialog.offsetHeight;
      const w = dialog.offsetWidth;
      let x = r.right + 10, y = r.bottom - h - 5;
      let tail = 'left';
      if (mobile.matches || x+w > innerWidth-12) {
        x = Math.max(12, Math.min(r.left, innerWidth-w-12));
        y = r.top - h - 16;
        tail = 'bottom';
      }
      if (r.bottom < 0 || r.top > innerHeight) { x = 16; y = innerHeight-h-64; tail='none'; }
      const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 72;
      y = Math.max(headerBottom + 8, Math.min(y, innerHeight-h-12));
      dialog.style.left = `${x}px`;
      dialog.style.top = `${y}px`;
      dialog.style.bottom = 'auto';
      dialog.dataset.tail = tail;
    }

    function hideDialog(returnFocus=false) {
      dialog.hidden = true;
      character.setAttribute('aria-expanded','false');
      if (returnFocus && !pet.hidden) character.focus({preventScroll:true});
    }

    function openDialog(kind='prompt') {
      restoreFocus = document.activeElement;
      if (kind==='won') {
        title.textContent = 'All bugs fixed!';
        copy.textContent = 'Thanks for the help. Back to research?';
        primary.textContent = 'Play again'; secondary.textContent = 'Back to reading';
      } else if (kind==='hunting') {
        title.textContent = 'Nice aim!';
        copy.textContent = `${caught.size} of ${TOTAL} bugs caught. Click the remaining bugs in the page margins.`;
        primary.textContent = 'Keep hunting'; secondary.textContent = 'End game';
      } else {
        title.textContent = 'Bug hunt?';
        copy.textContent = 'A few tiny bugs are hiding on this page. Shall we catch them?';
        primary.textContent = "Let's go!"; secondary.textContent = 'Maybe later';
        setState('prompt');
      }
      primary.dataset.petAction = kind==='hunting' ? 'continue' : 'start';
      secondary.dataset.petAction = kind==='hunting' ? 'end' : 'dismiss';
      dialog.hidden = false;
      character.setAttribute('aria-expanded','true');
      positionDialog();
      primary.focus({preventScroll:true});
      if (state==='hunting') schedulePlacement();
    }

    // Check visual content, not just links. Text ranges represent the rendered lines,
    // including link fragments; figures/media and controls reserve their whole boxes.
    function protectedRects() {
      const out=[];
      const add=(r,p=9)=>{ if(isVisible(r))out.push(expanded(r,p)); };
      document.querySelectorAll('header,nav,figure,img,video,iframe,input,textarea,select,button,summary,a,[role="button"],.portrait-placeholder,.profile,.photo-banner,.section-heading,.preview-notice').forEach(el=>{
        if(el.closest('[data-bughunt]') || el.closest('[hidden]'))return;
        for(const r of el.getClientRects())add(r,10);
      });
      const main = document.querySelector('.page-layout');
      if(main){
        const walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT,{
          acceptNode(node){
            if(!node.textContent.trim() || node.parentElement.closest('[data-bughunt],script,style,[hidden]'))return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        const range=document.createRange();
        let node;
        while((node=walker.nextNode())){
          range.selectNodeContents(node);
          for(const r of range.getClientRects())add(r,8);
        }
        range.detach?.();
      }
      add(character.getBoundingClientRect(),16);
      if(!dialog.hidden)add(dialog.getBoundingClientRect(),16);
      if(!hud.hidden)add(hud.getBoundingClientRect(),12);
      return out;
    }

    function bugSVG(i) {
      return `<svg viewBox="0 0 36 36" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="#4b4441" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 13-4-3M11 19H6m7 7-5 3m16-16 4-3m-3 9h5m-7 7 5 3"/><path d="m15 10-2-4m8 4 2-4"/><ellipse cx="18" cy="21" rx="10" ry="10" fill="${colors[i]}"/><path d="M18 15v15" opacity=".45"/><path d="M12 13c0-3.4 2.7-6 6-6s6 2.6 6 6" fill="#fbf5e9"/><circle cx="15.5" cy="11.2" r=".7" fill="#4b4441" stroke="none"/><circle cx="20.5" cy="11.2" r=".7" fill="#4b4441" stroke="none"/><circle cx="13.5" cy="20" r="1.3" fill="#4b4441" stroke="none" opacity=".65"/><circle cx="23" cy="24" r="1.4" fill="#4b4441" stroke="none" opacity=".65"/><circle cx="22" cy="18.5" r="1" fill="#4b4441" stroke="none" opacity=".65"/><circle cx="14" cy="26" r="1" fill="#4b4441" stroke="none" opacity=".65"/></g></svg>`;
    }

    // Prefer whitespace. Do not use a random fallback that could cover a link.
    // Very narrow screens may show fewer bugs at once; replacements appear as
    // space becomes available. The total always remains five.
    function choosePlaces(blocked,count) {
      const s=size(), step=28;
      const header=document.querySelector('.site-header')?.getBoundingClientRect();
      const top=Math.max(16,(header?.bottom||0)+14);
      const points=[];
      for(let y=top;y<=innerHeight-s-16;y+=step){
        for(let x=12;x<=innerWidth-s-12;x+=step){
          const box=rect(x,y,s,s);
          if(!blocked.some(b=>intersects(box,b)))points.push(box);
        }
      }
      const picks=[];
      while(points.length && picks.length<count){
        let best=0,bestScore=-1;
        points.forEach((p,i)=>{
          const centerX=p.left+s/2,centerY=p.top+s/2;
          const distance=picks.length?Math.min(...picks.map(q=>Math.hypot(p.left-q.left,p.top-q.top))):Math.hypot(centerX-innerWidth*.27,centerY-innerHeight*.85);
          const weight=distance+Math.random()*85;
          if(weight>bestScore){bestScore=weight;best=i;}
        });
        const chosen=points.splice(best,1)[0];picks.push(chosen);
        for(let i=points.length-1;i>=0;i--)if(intersects(expanded(chosen,24),points[i]))points.splice(i,1);
      }
      return picks;
    }

    function placeBugs() {
      repositionTimer=0;
      if(state!=='hunting'||document.hidden||document.fullscreenElement)return;
      isTransitioning=false;
      layer.hidden=false;layer.style.visibility='visible';
      const focused=document.activeElement?.dataset.bugId;
      occupied=protectedRects();
      const remaining=Array.from({length:TOTAL},(_,i)=>i).filter(i=>!caught.has(i));
      const spots=choosePlaces(occupied,remaining.length);
      layer.replaceChildren();
      remaining.slice(0,spots.length).forEach((id,i)=>{
        const b=document.createElement('button');
        b.type='button';b.className='little-bug';b.dataset.bugId=String(id);
        b.setAttribute('aria-label',`Catch bug ${id+1} of ${TOTAL}`);
        b.style.left=`${spots[i].left}px`;b.style.top=`${spots[i].top}px`;
        b.style.setProperty('--bug-tilt',`${[-14,9,-7,13,5][id]}deg`);
        b.innerHTML=bugSVG(id);
        b.addEventListener('click',event=>{event.stopPropagation();catchBug(id,b,event.detail===0);});
        layer.appendChild(b);
      });
      if(focused!==undefined)layer.querySelector(`[data-bug-id="${focused}"]`)?.focus({preventScroll:true});
      // No point covered by a control/text/media? Waiting for a scroll is safer
      // than covering the page with an artificial game board.
      if(!spots.length)say('No clear space here. Scroll a little to find the remaining bugs.');
    }

    function schedulePlacement(delay=140) {
      if(state!=='hunting')return;
      isTransitioning=true;
      layer.style.visibility='hidden';
      clearTimeout(repositionTimer);
      repositionTimer=setTimeout(placeBugs,delay);
    }

    function dust(x,y) {
      if(reduced.matches)return;
      for(let i=0;i<6;i++){
        const el=document.createElement('span');el.className='pet-dust';effects.appendChild(el);
        const angle=i*Math.PI/3,dx=Math.cos(angle)*22,dy=Math.sin(angle)*22;
        const anim=el.animate([{transform:`translate(${x}px,${y}px)`,opacity:.9},{transform:`translate(${x+dx}px,${y+dy}px) scale(.2)`,opacity:0}],{duration:400,easing:'ease-out'});
        anim.onfinish=()=>el.remove();
      }
      const plus=document.createElement('span');plus.className='pet-plus';plus.textContent='+1';plus.style.left=`${x+5}px`;plus.style.top=`${y-10}px`;effects.appendChild(plus);
      plus.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-20px)',opacity:0}],{duration:650,easing:'ease-out'}).onfinish=()=>plus.remove();
    }

    function shot(x,y,done) {
      const r=character.getBoundingClientRect();
      const opticalShift=parseFloat(getComputedStyle(pet.querySelector('.pet-art')).left)||0;
      const start={x:r.left+r.width*.79+opticalShift,y:r.top+r.height*.47};
      if(reduced.matches||!isVisible(r)||!Element.prototype.animate){done();return;}
      const angle=Math.atan2(y-start.y,x-start.x)*180/Math.PI;
      pet.style.setProperty('--pet-aim',`${Math.max(-16,Math.min(8,angle+13))}deg`);
      pet.classList.remove('is-shooting');void pet.offsetWidth;pet.classList.add('is-shooting');
      clearTimeout(shotTimer);shotTimer=setTimeout(()=>pet.classList.remove('is-shooting'),380);
      const dot=document.createElement('span');dot.className='pet-light-dot';effects.appendChild(dot);
      const anim=dot.animate([{transform:`translate(${start.x}px,${start.y}px) scale(.6)`,opacity:0},{transform:`translate(${start.x}px,${start.y}px) scale(1)`,opacity:1,offset:.05},{transform:`translate(${x}px,${y}px) scale(.8)`,opacity:1}],{duration:Math.min(430,220+Math.hypot(x-start.x,y-start.y)*.1),easing:'ease-out'});
      anim.onfinish=()=>{dot.remove();done();};
    }

    function catchBug(id,button,keyboard=false) {
      if(state!=='hunting'||caught.has(id)||isTransitioning)return;
      const r=button.getBoundingClientRect();
      // Validate again at click time in case content shifted since placement.
      if(protectedRects().some(b=>intersects(r,b))){schedulePlacement(0);return;}
      caught.add(id);button.disabled=true;button.classList.add('is-caught');
      score.textContent=`${caught.size} / ${TOTAL}`;
      say(`${caught.size} of ${TOTAL} bugs caught.`);
      const thisSession=session;
      shot(r.left+r.width/2,r.top+r.height/2,()=>{
        if(thisSession!==session||state!=='hunting')return;
        dust(r.left+r.width/2,r.top+r.height/2);
        button.remove();
        if(caught.size===TOTAL){
          clearTimeout(repositionTimer);layer.replaceChildren();layer.hidden=true;hud.hidden=true;
          setState('won');openDialog('won');say('All bugs fixed. Thanks for the help!');
        }else if(layer.querySelectorAll('.little-bug:not(:disabled)').length===0){
          placeBugs();if(keyboard)layer.querySelector('.little-bug')?.focus({preventScroll:true});
        }else if(keyboard){layer.querySelector('.little-bug:not(:disabled)')?.focus({preventScroll:true});}
      });
    }

    function startGame() {
      session++;clearTimeout(winTimer);caught.clear();score.textContent=`0 / ${TOTAL}`;
      hideDialog();setState('hunting');hud.hidden=false;layer.hidden=false;
      effects.replaceChildren();placeBugs();
      say('Bug Hunt started. Catch five bugs in the empty areas. Press Escape to stop.');
      // The first target is focusable without trapping users in a dialog.
      layer.querySelector('.little-bug')?.focus({preventScroll:true});
    }

    function endGame(focus=false) {
      session++;clearTimeout(repositionTimer);clearTimeout(shotTimer);clearTimeout(winTimer);
      layer.replaceChildren();layer.hidden=true;effects.replaceChildren();hud.hidden=true;
      pet.classList.remove('is-shooting');hideDialog(focus);setState('idle');
    }

    function sleep() {
      endGame(false);setState('sleeping');pet.hidden=true;wake.hidden=false;
      if(sidebarSlot)sidebarSlot.hidden=true;
      updateSidebarOffset();
      say('Little Yuchen is taking a nap. Wake him from the footer.');
    }

    function updateSidebarOffset() {
      if (!profile) return;
      if (mobile.matches) {
        profile.style.removeProperty('--pet-profile-top');
        if (sidebarSlot) sidebarSlot.style.removeProperty('--pet-gap');
        return;
      }
      const preferredTop = 123;
      const links = profile.querySelector('.profile-links');
      if (sidebarSlot && !sidebarSlot.hidden && links) {
        // Measure content depth, not its scrolling viewport coordinate. This
        // prevents a feedback loop between sticky positioning and the landing.
        const detailDepth = links.getBoundingClientRect().bottom - profile.getBoundingClientRect().top;
        const petSize = parseFloat(getComputedStyle(sidebarSlot).getPropertyValue('--pet-size')) || 112;
        const petHeight = petSize * .822;
        const lowerInset = 24;
        const freeSpace = innerHeight - preferredTop - detailDepth - lowerInset;
        const gap = Math.max(64, (freeSpace - petHeight) / 2);
        const value = `${Math.round(gap)}px`;
        if (sidebarSlot.style.getPropertyValue('--pet-gap') !== value) {
          sidebarSlot.style.setProperty('--pet-gap', value);
        }
      }
      // Short viewports may scroll the top of the sidebar out of view so that
      // the pet and its score remain reachable without overlapping the links.
      const top = Math.min(preferredTop, innerHeight - profile.offsetHeight - 20);
      const topValue = `${top}px`;
      if (profile.style.getPropertyValue('--pet-profile-top') !== topValue) {
        profile.style.setProperty('--pet-profile-top', topValue);
      }
    }

    function adaptLayout() {
      // One DOM anchor at every breakpoint: below the contact links.
      // Never append the character to the body or pin it to a viewport corner.
      if (sidebarSlot) {
        if (pet.parentElement !== sidebarSlot) sidebarSlot.appendChild(pet);
        sidebarSlot.hidden = state === 'sleeping';
      }
      updateSidebarOffset();positionDialog();schedulePlacement();
    }

    character.addEventListener('click',()=>{
      if (state === 'dormant' || state === 'arriving') return;
      if(!dialog.hidden){hideDialog();if(state==='prompt')setState('idle');return;}
      openDialog(state==='hunting'?'hunting':state==='won'?'won':'prompt');
    });
    pet.addEventListener('click',event=>{
      const action=event.target.closest('[data-pet-action]')?.dataset.petAction;
      if(!action)return;
      if(action==='start')startGame();
      else if(action==='continue'){hideDialog();schedulePlacement(0);}
      else if(action==='end')endGame(true);
      else if(action==='sleep')sleep();
      else if(action==='dismiss'){
        if(state==='won')endGame(true);
        else{hideDialog(true);if(state==='prompt')setState('idle');if(state==='hunting')schedulePlacement(0);}
      }
    });
    wake.addEventListener('click',()=>{pet.hidden=false;wake.hidden=true;setState('idle');if(sidebarSlot)sidebarSlot.hidden=false;adaptLayout();character.focus({preventScroll:false});});
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape')return;
      if(state==='hunting'||state==='won'){endGame(true);say('Bug Hunt ended.');}
      else if(!dialog.hidden){hideDialog(true);setState('idle');}
    });
    document.addEventListener('click',event=>{
      if(dialog.hidden||pet.contains(event.target))return;
      // Never prevent navigation or absorb a click on the real page.
      if(state==='prompt'){hideDialog();setState('idle');}
    });
    window.addEventListener('scroll',()=>{positionDialog();schedulePlacement();},{passive:true});
    window.addEventListener('resize',()=>{updateSidebarOffset();positionDialog();schedulePlacement(180);},{passive:true});
    document.addEventListener('fullscreenchange',()=>{layer.style.visibility=document.fullscreenElement?'hidden':'visible';schedulePlacement();});
    document.addEventListener('visibilitychange',()=>{pet.classList.toggle('is-page-hidden',document.hidden);if(document.hidden){clearTimeout(repositionTimer);layer.style.visibility='hidden';}else schedulePlacement();});
    document.querySelectorAll('img,video').forEach(el=>el.addEventListener('load',()=>schedulePlacement()));
    if ('ResizeObserver' in window) {
      new ResizeObserver(()=>schedulePlacement()).observe(document.querySelector('main'));
      if (profile) new ResizeObserver(()=>{updateSidebarOffset();positionDialog();schedulePlacement();}).observe(profile);
    }
    mobile.addEventListener('change',adaptLayout);
    reduced.addEventListener('change',()=>{effects.replaceChildren();pet.classList.remove('is-shooting');});
    // A real scroll is the invitation; load, restored positions and anchor jumps
    // alone never trigger the pet. No storage, analytics or attention tracking.
    let hasArrived = false;
    let scrollIntentAt = -Infinity;
    let intentionalDistance = 0;
    let lastScrollY = scrollY;
    let arrivalTimer = 0;
    let arrivalFinishTimer = 0;
    const SCROLL_TO_INVITE = 80;

    function finishArrival() {
      if (state !== 'arriving') return;
      clearTimeout(arrivalFinishTimer);
      pet.classList.remove('is-arriving');
      character.disabled = false;
      pet.dataset.arrival = 'complete';
      setState('idle');
      say('Little Yuchen has arrived below the contact links. Select him to chat.');
    }

    function landingIsVisible() {
      if (!sidebarSlot || document.hidden || document.fullscreenElement) return false;
      const r=sidebarSlot.getBoundingClientRect();
      const headerBottom=document.querySelector('.site-header')?.getBoundingClientRect().bottom || 72;
      // Only the actual landing + portal must be visible, not the blank spacer.
      const style = getComputedStyle(sidebarSlot);
      const landingTop = r.top + parseFloat(style.paddingTop || '0');
      const petHeight = (parseFloat(style.getPropertyValue('--pet-size')) || 112) * .822;
      return landingTop - 40 >= headerBottom + 10 && landingTop + petHeight <= innerHeight - 8;
    }

    function arrive() {
      if (hasArrived || !landingIsVisible()) return;
      hasArrived = true;
      clearTimeout(arrivalTimer);
      pet.hidden = false;
      if (reduced.matches) {
        pet.dataset.arrival = 'complete';setState('idle');
        say('Little Yuchen is here, below the contact links.');
        return;
      }
      setState('arriving');
      pet.dataset.arrival = 'delivering';
      character.disabled = true;
      pet.classList.add('is-arriving');
      // The CSS sequence lowers both sprite and gripper together, opens the
      // soft jaws, then retracts the gripper before closing the portal.
      arrivalFinishTimer = setTimeout(finishArrival, 2900);
    }

    function maybeArrive() {
      if (!hasArrived && intentionalDistance >= SCROLL_TO_INVITE && landingIsVisible()) arrive();
    }

    function markScrollIntent(event) {
      if (hasArrived || !event.isTrusted) return;
      if (event.type==='wheel' && Math.abs(event.deltaY)<1) return;
      if (event.type==='keydown') {
        if (!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) return;
        if (event.target.closest?.('input,textarea,select,[contenteditable="true"],button')) return;
      }
      if (event.type==='pointerdown' && event.clientX < document.documentElement.clientWidth - 18) return;
      // Compositor scrolling may update scrollY before this passive wheel listener.
      // Keep the last observed scroll event position so the first movement counts.
      scrollIntentAt=performance.now();
    }

    function onEngagedScroll() {
      const delta=Math.abs(scrollY-lastScrollY);lastScrollY=scrollY;
      if (hasArrived) return;
      if (performance.now()-scrollIntentAt<1800 && delta>1) intentionalDistance+=delta;
      clearTimeout(arrivalTimer);
      // Begin when movement has settled, rather than playing out of sight.
      arrivalTimer=setTimeout(maybeArrive,120);
    }

    window.addEventListener('wheel',markScrollIntent,{passive:true});
    window.addEventListener('touchmove',markScrollIntent,{passive:true});
    window.addEventListener('pointerdown',markScrollIntent,{passive:true});
    document.addEventListener('keydown',markScrollIntent);
    window.addEventListener('scroll',onEngagedScroll,{passive:true});
    window.addEventListener('resize',()=>{clearTimeout(arrivalTimer);arrivalTimer=setTimeout(maybeArrive,180);},{passive:true});
    if ('IntersectionObserver' in window && sidebarSlot) {
      const landingObserver=new IntersectionObserver(()=>maybeArrive(),{threshold:[0,.5,1]});
      landingObserver.observe(sidebarSlot);
    }
    character.addEventListener('animationend',event=>{
      if (event.animationName==='pet-delivered') finishArrival();
    });
    document.addEventListener('visibilitychange',()=>{
      if (document.hidden && state==='arriving') finishArrival();
      if (!document.hidden) maybeArrive();
    });
    reduced.addEventListener('change',()=>{if(reduced.matches)finishArrival();});

    pet.hidden=true;pet.dataset.arrival='waiting';setState('dormant');adaptLayout();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
