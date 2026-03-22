const Navbar = {
    init() {
        document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = btn.getAttribute('data-page');
                if (page) App.navigate(page);
            });
        });
        // Position indicator on load
        requestAnimationFrame(() => this._moveIndicator());
    },

    setActive(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        this._moveIndicator();
    },

    _moveIndicator() {
        const active = document.querySelector('.nav-btn.active');
        const indicator = document.getElementById('nav-indicator');
        if (!active || !indicator) return;
        const nav = document.getElementById('bottom-nav');
        const navRect = nav.getBoundingClientRect();
        const btnRect = active.getBoundingClientRect();
        const left = btnRect.left - navRect.left + (btnRect.width - 32) / 2;
        indicator.style.left = left + 'px';
    }
};
