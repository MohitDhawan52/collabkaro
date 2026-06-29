/* ============================================
   COLLABKARO 3D SHOPIFY THEME — MAIN JS
============================================ */

(function () {
  'use strict';

  /* ── PAGE LOADER ─────────────────────────── */
  const loader = document.querySelector('.page-loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('loaded'), 600);
    });
  }

  /* ── ENTRANCE OVERLAY ────────────────────── */
  const overlay = document.getElementById('entrance-overlay');
  const enterBtn = document.getElementById('enter-btn');
  const shopContent = document.getElementById('shop-content');
  const shopHeader = document.querySelector('.shop-header');

  if (overlay && enterBtn) {
    // Three.js particle field on entrance canvas
    initEntranceCanvas();

    enterBtn.addEventListener('click', () => {
      triggerEntranceTransition();
    });
  }

  function initEntranceCanvas() {
    const canvas = document.getElementById('entrance-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    camera.position.z = 5;

    // Floating particles
    const particleCount = 1800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 30;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;

      // Gold tones
      const t = Math.random();
      colors[i3]     = 0.4 + t * 0.4;
      colors[i3 + 1] = 0.3 + t * 0.25;
      colors[i3 + 2] = 0.1 + t * 0.1;

      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Cloth-like ribbon effect using lines
    const ribbonGeo = new THREE.BufferGeometry();
    const ribbonPoints = [];
    for (let i = 0; i < 200; i++) {
      const t = (i / 200) * Math.PI * 4;
      ribbonPoints.push(
        Math.sin(t) * 3,
        Math.cos(t * 0.5) * 1.5,
        Math.sin(t * 0.3) * 2
      );
    }
    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbonPoints, 3));
    const ribbonMat = new THREE.LineBasicMaterial({
      color: 0xc9a96e,
      transparent: true,
      opacity: 0.15,
    });
    const ribbon = new THREE.Line(ribbonGeo, ribbonMat);
    scene.add(ribbon);

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let frameId;
    const clock = new THREE.Clock();

    function animate() {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      particles.rotation.y = t * 0.04 + mouseX * 0.08;
      particles.rotation.x = t * 0.02 + mouseY * 0.05;

      ribbon.rotation.y = t * 0.08 + mouseX * 0.1;
      ribbon.rotation.x = t * 0.04;

      renderer.render(scene, camera);
    }

    animate();

    // Store cancelAnimationFrame ref for cleanup
    overlay._cancelAnim = () => cancelAnimationFrame(frameId);
    overlay._scene = scene;
    overlay._renderer = renderer;
  }

  function triggerEntranceTransition() {
    if (!overlay) return;
    overlay.classList.add('exiting');

    const canvas = document.getElementById('entrance-canvas');
    const content = overlay.querySelector('.entrance-content');
    const scrollHint = overlay.querySelector('.entrance-scroll-hint');

    // Phase 1: content fades out
    if (typeof gsap !== 'undefined') {
      gsap.to([content, scrollHint], {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: 'power2.in',
      });

      // Phase 2: 3D tunnel fly-in
      gsap.to(canvas, {
        delay: 0.4,
        duration: 1.2,
        ease: 'power3.in',
        onUpdate: function () {
          const prog = this.progress();
          canvas.style.transform = `scale(${1 + prog * 8}) translateZ(0)`;
          canvas.style.opacity = 1 - prog;
        },
      });

      // Phase 3: overlay collapses
      gsap.to(overlay, {
        delay: 0.8,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => {
          overlay.style.display = 'none';
          if (overlay._cancelAnim) overlay._cancelAnim();
          revealShop();
        },
      });
    } else {
      // Fallback without GSAP
      overlay.style.transition = 'opacity 1.2s ease';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        revealShop();
      }, 1200);
    }
  }

  function revealShop() {
    if (shopContent) {
      shopContent.classList.add('visible');
      document.body.style.overflow = '';
    }
    if (shopHeader) {
      setTimeout(() => shopHeader.classList.add('revealed'), 100);
    }
    initHeroCanvas();
    initScrollReveal();
    initProductTilt();
  }

  /* ── HERO 3D CANVAS ──────────────────────── */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 6;

    // Floating fabric planes
    const planeGroup = new THREE.Group();
    scene.add(planeGroup);

    const planes = [];
    for (let i = 0; i < 6; i++) {
      const w = 1.5 + Math.random() * 2;
      const h = 2 + Math.random() * 3;
      const geo = new THREE.PlaneGeometry(w, h, 12, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xc9a96e : 0x1a1a1a,
        transparent: true,
        opacity: 0.06 + Math.random() * 0.06,
        side: THREE.DoubleSide,
        wireframe: Math.random() > 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh._speed = {
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.001,
      };
      planeGroup.add(mesh);
      planes.push(mesh);
    }

    let mx = 0, my = 0;
    document.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      planes.forEach(p => {
        p.rotation.x += p._speed.x;
        p.rotation.y += p._speed.y;
        p.rotation.z += p._speed.z;
        // wave vertex deformation
        const pos = p.geometry.attributes.position;
        for (let vi = 0; vi < pos.count; vi++) {
          const ox = pos.getX(vi);
          const oy = pos.getY(vi);
          pos.setZ(vi, Math.sin(ox * 1.5 + t * 0.5) * 0.08 + Math.cos(oy * 1.2 + t * 0.4) * 0.06);
        }
        pos.needsUpdate = true;
      });

      planeGroup.rotation.y += (mx * 0.3 - planeGroup.rotation.y) * 0.03;
      planeGroup.rotation.x += (-my * 0.15 - planeGroup.rotation.x) * 0.03;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ── SCROLL REVEAL ───────────────────────── */
  function initScrollReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(el => observer.observe(el));
  }

  /* ── PRODUCT 3D TILT ─────────────────────── */
  function initProductTilt() {
    const cards = document.querySelectorAll('.product-3d-card');
    cards.forEach(card => {
      const wrap = card.closest('.product-3d-visual');
      if (!wrap) return;

      wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `
          perspective(1000px)
          rotateY(${x * 14}deg)
          rotateX(${-y * 10}deg)
          translateZ(10px)
        `;
      });

      wrap.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0)';
        card.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      });

      wrap.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s linear, box-shadow 0.5s ease';
      });
    });
  }

  /* ── 3D SCROLL PARALLAX ON PRODUCT ITEMS ── */
  function initProductParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.product-3d-item').forEach((item, i) => {
      const visual = item.querySelector('.product-3d-visual');
      const info = item.querySelector('.product-3d-info');

      gsap.fromTo(visual,
        { opacity: 0, x: i % 2 === 0 ? -80 : 80, rotateY: i % 2 === 0 ? -15 : 15 },
        {
          opacity: 1, x: 0, rotateY: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 75%',
            end: 'bottom 25%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      if (info) {
        gsap.fromTo(info,
          { opacity: 0, y: 50 },
          {
            opacity: 1, y: 0,
            duration: 1,
            delay: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      }
    });
  }

  /* ── CART DRAWER ─────────────────────────── */
  const cartBtns = document.querySelectorAll('[data-cart-open]');
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartClose = document.querySelector('.cart-close-btn');
  const overlayBg = document.querySelector('.overlay-bg');

  function openCart() {
    cartDrawer?.classList.add('open');
    overlayBg?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer?.classList.remove('open');
    overlayBg?.classList.remove('active');
    document.body.style.overflow = '';
  }

  cartBtns.forEach(btn => btn.addEventListener('click', openCart));
  cartClose?.addEventListener('click', closeCart);
  overlayBg?.addEventListener('click', closeCart);

  /* ── SIZE SELECTOR ───────────────────────── */
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.size-options')?.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* ── COLOR SWATCH ────────────────────────── */
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.closest('.color-options')?.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
    });
  });

  /* ── ADD TO CART ─────────────────────────── */
  document.querySelectorAll('.add-to-cart-btn, .btn-primary[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const variantId = btn.dataset.variantId;
      if (!variantId) return;

      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="btn-text">Adding...</span>';
      btn.disabled = true;

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: 1 }),
        });
        if (res.ok) {
          btn.innerHTML = '<span class="btn-text">Added ✓</span>';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            openCart();
            refreshCart();
          }, 1000);
        }
      } catch {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  });

  async function refreshCart() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      const countEl = document.querySelector('[data-cart-count]');
      if (countEl) countEl.textContent = cart.item_count;
    } catch {}
  }

  /* ── INIT ON PAGE LOAD ───────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    // If not homepage (no entrance overlay), init directly
    if (!overlay) {
      initScrollReveal();
      initProductTilt();
      initProductParallax();
    } else {
      // Block scroll until shop entered
      document.body.style.overflow = 'hidden';
    }
    refreshCart();
  });

})();
