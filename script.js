'use strict';
document.getElementById('year').textContent = new Date().getFullYear();
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.mobile-nav');
function closeMenu(returnFocus = false) {
  const wasOpen = !menu.hidden;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  if (returnFocus && wasOpen) toggle.focus();
}
toggle.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
document.addEventListener('click', event => {
  if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 651px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
window.addEventListener('hashchange', () => closeMenu());
// Keep playback intentional and avoid two films playing simultaneously.
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
  const showError = () => { video.closest('figure').querySelector('.video-status').hidden = false; };
  video.addEventListener('error', showError);
  video.querySelectorAll('source').forEach(source => source.addEventListener('error', showError));
});

// Progressive enhancement: reading progress and section navigation.
const progressBar = document.getElementById('scroll-progress-bar');
const navLinks = document.querySelectorAll('.desktop-nav a, .mobile-nav a');
let scrollScheduled = false;
function updateReadingState(){
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0})`;
  let active = 'about';
  for (const section of document.querySelectorAll('main section[id]')) {
    if (section.getBoundingClientRect().top <= 145) active = section.id;
  }
  navLinks.forEach(link => {
    const current = link.getAttribute('href') === `#${active}`;
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollScheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scrollScheduled) {scrollScheduled = true; requestAnimationFrame(updateReadingState);}
}, {passive:true});
window.addEventListener('resize', updateReadingState);
updateReadingState();

// Personal photography carousel: manual controls, unobtrusive auto-advance.
(() => {
  const banner=document.querySelector('.photo-banner');
  if(!banner)return;
  const slides=[...banner.querySelectorAll('.photo-slide')];
  const dots=[...banner.querySelectorAll('.photo-dot')];
  const announcement=banner.querySelector('.photo-announcement');
  let current=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const show=(index,userInitiated=false)=>{
    current=(index+slides.length)%slides.length;
    slides.forEach((el,i)=>el.classList.toggle('is-active',i===current));
    dots.forEach((el,i)=>{el.classList.toggle('is-active',i===current);el.setAttribute('aria-pressed',String(i===current));});
    if(userInitiated)announcement.textContent=`Photograph ${current+1} of ${slides.length}`;
  };
  banner.querySelector('.photo-prev').addEventListener('click',()=>show(current-1,true));
  banner.querySelector('.photo-next').addEventListener('click',()=>show(current+1,true));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i,true)));
  let timer=null;
  const stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
  const start=()=>{stop();if(reduced.matches||document.hidden)return;timer=setInterval(()=>show(current+1),5000);};
  banner.addEventListener('mouseenter',stop);
  banner.addEventListener('mouseleave',start);
  banner.addEventListener('focusin',stop);
  banner.addEventListener('focusout',e=>{if(!banner.contains(e.relatedTarget))start();});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  reduced.addEventListener?.('change',start);
  start();
})();

