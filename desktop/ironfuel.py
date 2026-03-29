#!/usr/bin/env python3
"""
IronFuel Desktop App
Native wrapper using PyQt6 + QtWebEngine.
Handles Firebase Auth OAuth popups (Google/Apple sign-in).
"""

import sys
import os
from PyQt6.QtWidgets import QApplication
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import (
    QWebEnginePage, QWebEngineProfile, QWebEngineSettings
)
from PyQt6.QtCore import QUrl, Qt, QTimer
from PyQt6.QtGui import QIcon

APP_NAME = "IronFuel"
APP_URL = "https://1food.fr"
APP_WIDTH = 420
APP_HEIGHT = 820


class AuthPopupPage(QWebEnginePage):
    """Page for the OAuth popup — lets Firebase JS close it naturally."""
    def __init__(self, profile, parent_page, parent=None):
        super().__init__(profile, parent)
        self._parent_page = parent_page

    def javaScriptConsoleMessage(self, level, msg, line, source):
        # Silence console noise from auth pages
        pass


class AuthPopup(QWebEngineView):
    """Window for OAuth flow (Google/Apple sign-in)."""
    def __init__(self, profile, parent_page, parent=None):
        super().__init__(parent)
        self._parent_page = parent_page
        page = AuthPopupPage(profile, parent_page, self)
        self.setPage(page)
        self.setWindowTitle("Connexion — IronFuel")
        self.resize(480, 700)
        self.setMinimumSize(400, 500)
        self.setAttribute(Qt.WidgetAttribute.WA_DeleteOnClose, True)

        # Monitor URL for auth completion
        page.urlChanged.connect(self._on_url_changed)

        # Also watch for the page trying to close itself (Firebase does window.close())
        page.windowCloseRequested.connect(self.close)

    def _on_url_changed(self, url):
        url_str = url.toString().lower()
        # Only close when auth handler has finished and redirected back
        # Firebase redirects to /__/auth/handler which then calls window.close()
        # We don't force close — let Firebase handle it via windowCloseRequested


class AppPage(QWebEnginePage):
    """Main app page — intercepts window.open() for OAuth popups."""
    def __init__(self, profile, parent=None):
        super().__init__(profile, parent)
        self._popups = []

    def createWindow(self, window_type):
        """Called when JS does window.open() (Firebase signInWithPopup)."""
        popup = AuthPopup(self.profile(), self)
        popup.show()
        self._popups.append(popup)
        popup.destroyed.connect(lambda p=popup: self._cleanup(p))
        return popup.page()

    def _cleanup(self, popup):
        if popup in self._popups:
            self._popups.remove(popup)

    def javaScriptConsoleMessage(self, level, msg, line, source):
        # Optional: uncomment for debugging
        # print(f"[JS] {msg}")
        pass


def get_icon_path():
    if getattr(sys, 'frozen', False):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    icon = os.path.join(base, 'icon.ico')
    return icon if os.path.exists(icon) else None


def main():
    # High DPI support
    os.environ['QT_ENABLE_HIGHDPI_SCALING'] = '1'

    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setOrganizationName("IronFuel")

    icon_path = get_icon_path()
    if icon_path:
        app.setWindowIcon(QIcon(icon_path))

    # Profile with persistent cookies + storage
    profile = QWebEngineProfile.defaultProfile()
    profile.setPersistentCookiesPolicy(
        QWebEngineProfile.PersistentCookiesPolicy.ForcePersistentCookies
    )
    # Keep storage between sessions
    profile.setHttpCacheType(QWebEngineProfile.HttpCacheType.DiskHttpCache)

    # Settings
    settings = profile.settings()
    settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptCanOpenWindows, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptCanAccessClipboard, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.LocalStorageEnabled, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True)
    settings.setAttribute(QWebEngineSettings.WebAttribute.FullScreenSupportEnabled, True)

    # Main window
    view = QWebEngineView()
    page = AppPage(profile, view)
    view.setPage(page)
    view.setWindowTitle(APP_NAME)
    view.resize(APP_WIDTH, APP_HEIGHT)
    view.setMinimumSize(360, 640)

    if icon_path:
        view.setWindowIcon(QIcon(icon_path))

    # Dark title bar background while loading
    view.setStyleSheet("background-color: #0a0a0f;")

    # Mark as desktop app after load
    def on_load_finished(ok):
        if ok:
            page.runJavaScript("""
                document.documentElement.classList.add('desktop-app');
                localStorage.setItem('nutritrack_platform', 'desktop');
            """)

    view.loadFinished.connect(on_load_finished)
    view.setUrl(QUrl(APP_URL))
    view.show()

    sys.exit(app.exec())


if __name__ == '__main__':
    main()
