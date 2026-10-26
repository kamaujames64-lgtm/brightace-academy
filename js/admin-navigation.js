/* BrightAce shared admin navigation — V68 collapsible group menus */
(function () {
  'use strict';
  const groups = [
    { label: 'OVERVIEW', icon: '▦', links: [
      ['Dashboard', 'admin.html'], ['Client Admissions', 'admin-clients.html'], ['Work Assignments', 'admin-assignments.html']
    ]},
    { label: 'PEOPLE & DELIVERY', icon: '♙', links: [
      ['Tutors', 'admin-tutors.html'], ['Scheduling', 'admin-scheduling.html'], ['Quality Control', 'admin-quality.html'], ['Admin Team', 'admin-team.html']
    ]},
    { label: 'FINANCE & RECORDS', icon: '＄', links: [
      ['Payments', 'admin-payments.html'], ['Tutor Earnings', 'admin-tutor-earnings.html'], ['History', 'admin-history.html']
    ]},
    { label: 'SYSTEM', icon: '⚙', links: [
      ['Resources', 'admin-resources.html'], ['Reports', 'admin-reports.html'], ['System Health', 'admin-observability.html'], ['Recovery', 'admin-recovery.html'], ['Production QA', 'admin-production-qa.html'], ['Python Tools', 'admin-python.html'], ['Settings', 'admin-profile.html']
    ]}
  ];
  function init() {
    const path = (location.pathname.split('/').pop() || 'admin.html').toLowerCase();
    if (!/^admin(?:-[a-z0-9-]+)?\.html$/.test(path) || path === 'admin-login.html') return;
    const allNavs = [...document.querySelectorAll('nav')];
    allNavs.filter(nav => [...nav.querySelectorAll('a[href]')].some(a => /(?:^|\/)admin(?:-[a-z0-9-]+)?\.html(?:[?#].*)?$/i.test(a.getAttribute('href') || ''))).forEach(nav => nav.remove());

    const nav = document.createElement('nav');
    nav.className = 'ba-admin-global-nav';
    nav.setAttribute('aria-label', 'Admin navigation');
    const groupsMarkup = groups.map((group, index) => {
      const active = group.links.some(([, href]) => href.toLowerCase() === path);
      const id = 'ba-admin-menu-' + index;
      return '<details class="ba-admin-nav-group' + (active ? ' has-active' : '') + '" data-nav-group>' +
        '<summary aria-controls="' + id + '" aria-label="' + group.label + ' menu"' + (active ? ' data-current-group="true"' : '') + '>' +
        '<span class="ba-admin-nav-group-icon" aria-hidden="true">' + group.icon + '</span>' +
        '<span class="ba-admin-nav-group-title">' + group.label + '</span>' +
        (active ? '<span class="ba-admin-nav-current-dot" aria-label="Current section"></span>' : '') +
        '<span class="ba-admin-nav-chevron" aria-hidden="true"></span></summary>' +
        '<div class="ba-admin-nav-links" id="' + id + '" role="group" aria-label="' + group.label + ' pages">' +
        group.links.map(([name, href]) => '<a href="' + href + '"' + (path === href.toLowerCase() ? ' class="active" aria-current="page"' : '') + '>' + name + (path === href.toLowerCase() ? '<span class="ba-admin-nav-check" aria-hidden="true">✓</span>' : '') + '</a>').join('') +
        '</div></details>';
    }).join('');
    nav.innerHTML = '<div class="ba-admin-nav-groups">' + groupsMarkup + '</div>';
    const header = document.querySelector('body > header.nav, body > header');
    const headerInner = header && header.querySelector('.nav-inner');
    const existingBrand = headerInner && headerInner.querySelector('.brand');
    const oldAdminLabel = headerInner && headerInner.querySelector('.admin-top-label');
    if (oldAdminLabel) oldAdminLabel.remove();
    if (headerInner && existingBrand) {
      existingBrand.insertAdjacentElement('afterend', nav);
      headerInner.classList.add('ba-admin-header-inner');
    } else if (header) {
      header.insertAdjacentElement('afterend', nav);
    } else {
      const main = document.querySelector('body > main');
      if (main) main.insertAdjacentElement('beforebegin', nav);
      else document.body.insertAdjacentElement('afterbegin', nav);
    }

    // Keep the signed-in admin's uploaded profile photo visible in the shared header.
    if (headerInner && existingBrand) {
      let profileChip = headerInner.querySelector('.ba-admin-profile-chip');
      if (!profileChip) {
        profileChip = document.createElement('a');
        profileChip.className = 'ba-admin-profile-chip';
        profileChip.href = 'admin-profile.html';
        profileChip.setAttribute('aria-label', 'Open admin profile settings');
        profileChip.innerHTML = '<span class="ba-admin-profile-avatar" aria-hidden="true">👤</span><span class="ba-admin-profile-chip-label">My Profile</span>';
        nav.insertAdjacentElement('afterend', profileChip);
      }
      const adminToken = sessionStorage.getItem('brightace_admin_active_token_v4') || localStorage.getItem('brightace_admin_active_token_v4') || sessionStorage.getItem('brightace_admin_token_v4') || localStorage.getItem('brightace_admin_token_v4') || '';
      const refreshAdminProfileAvatar = () => {
        const currentToken = sessionStorage.getItem('brightace_admin_active_token_v4') || localStorage.getItem('brightace_admin_active_token_v4') || sessionStorage.getItem('brightace_admin_token_v4') || localStorage.getItem('brightace_admin_token_v4') || '';
        const avatar = profileChip.querySelector('.ba-admin-profile-avatar');
        if (!avatar) return;
        if (!currentToken) { avatar.textContent = '👤'; return; }
        const apiUrl = window.BRIGHTACE_API_URL || 'https://script.google.com/macros/s/AKfycbzs69au8SaV3o8wu2DHzD4VTY96oHVe0c_RUzEzzaMhD7yBkYnXujm_aJE7ZouY-JsK/exec';
        const body = new URLSearchParams();
        body.set('payload', JSON.stringify({ action: 'adminSessionProfile', adminToken: currentToken }));
        fetch(apiUrl, { method: 'POST', body, cache: 'no-store' }).then(r => r.json()).then(result => {
          if (!profileChip.isConnected || !avatar.isConnected) return;
          const profile = result && result.ok && result.admin ? result.admin : null;
          const photo = String(profile && profile.profilePictureUrl || '').trim();
          if (!photo) { avatar.textContent = '👤'; return; }
          const img = document.createElement('img');
          img.src = photo; img.alt = ''; img.loading = 'eager'; img.decoding = 'async';
          img.onerror = () => { img.remove(); avatar.textContent = '👤'; };
          avatar.replaceChildren(img);
        }).catch(() => {});
      };
      window.BrightAceRefreshAdminProfileAvatar = refreshAdminProfileAvatar;
      refreshAdminProfileAvatar();
      window.addEventListener('brightace:admin-profile-photo-updated', refreshAdminProfileAvatar);
    }

    const groupEls = [...nav.querySelectorAll('[data-nav-group]')];
    groupEls.forEach(group => group.addEventListener('toggle', () => {
      if (group.open) groupEls.forEach(other => { if (other !== group) other.open = false; });
    }));
    document.addEventListener('click', event => {
      if (!nav.contains(event.target)) groupEls.forEach(group => { group.open = false; });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const opened = groupEls.find(group => group.open);
        if (opened) { opened.open = false; opened.querySelector('summary').focus(); }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
