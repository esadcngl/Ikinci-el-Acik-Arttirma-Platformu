from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time
import re

def letgo_arama(aranan):
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-blink-features=AutomationControlled")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    try:
        search_url = f"https://www.letgo.com/arama?query_text={aranan.replace(' ', '%20')}&isSearchCall=true"
        driver.get(search_url)

        # 🛡️ Fiyatlar yüklenemezse bile hata verme
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.item-price span"))
        )

        html = driver.page_source

        soup = BeautifulSoup(html, "lxml")
        fiyatlar = []
        for span in soup.select("div.item-price span"):
            try:
                fiyat = int(re.sub(r"[^\d]", "", span.text.strip()))
                fiyatlar.append(fiyat)
            except:
                continue

        if fiyatlar:
            ort = sum(fiyatlar) // len(fiyatlar)
            return f"₺{min(fiyatlar):,} - ₺{max(fiyatlar):,} (ort: ₺{ort:,})"
        return "Veri bulunamadı"

    except Exception as e:
        print(f"[Letgo HATA]: {e}")
        return "Veri bulunamadı"

    finally:
        driver.quit()
