/* 
    Парсер сайта "Skillbox"
*/

import axios from 'axios';
import fs from 'fs';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

const pagesNumber = 20;
const baseLink = 'https://skillbox.ru/local/ajax/getArticlesIndex.php?';
let page = 1;

// Стартовое значение задержки следующего запроса (увеличивается с каждым запросом, чтобы не отправлять их слишком часто)
let parsingDelay = 3000;

// Стартовые параметры запроса (меняться будет только номер страницы)
let params = new URLSearchParams();
params.set('params[SECTION_ID]', '0');
params.set('params[CODE_EXCLUDE]', 'news');
params.set('params[FIRST_IS_FULL]', 'Y');
params.set('params[COUNT]', '14');
params.set('params[PAGE_NUM]', '1');
params.set('params[FIELDS][]', 'PROPERTY_FAKE_COUNTER');
params.set('params[CACHE_TYPE]', 'A');
params.set('params[COMPONENT_TEMPLATE]', 'articles');

function paginator() {
    async function getArticles() {
        console.log('Запрос статей со страницы ' + params.get('params[PAGE_NUM]'));

        // Запрос к странице сайта
        let jsonToHtml;
        await axios.post(baseLink, params).then((response) => {
            jsonToHtml = response.data.html;
        });

        // Инициализация библиотеки jsdom для разбора полученных HTML-данных, как в браузере
        let dom = new JSDOM(jsonToHtml);

        function getPinnedArticles(number) {
            // Находим все прикрепленные статьи
            let pinnedNodes = dom.window.document.querySelectorAll('.important-block__main-title');

            // Получение заголовка
            let pinnedTitle = pinnedNodes[number].innerHTML.trim().replace(/&nbsp;/g, ' ');

            // Получение ссылки
            let pinnedLink = pinnedNodes[number].href;

            // Итоговая ссылка с заголовком статьи
            let pinnedArticle = `<a href='https://skillbox.ru${pinnedLink}'>${pinnedTitle}</a><br>\n`; //--------------------------------
            console.log('Закрепленная статья: ' + pinnedTitle);

            // Запись закреплённой статьи в файл
            fs.appendFileSync('./articles.html', pinnedArticle, (err) => {
                if (err) throw err;
            });
        }

        function getDefaultArticles(from, to) {
            // Находим все обычные статьи
            let defaultNodes = dom.window.document.querySelectorAll('.media-catalog__tile-title');
            let articlesNumber = defaultNodes.length;

            if (articlesNumber < 12) {
            }

            for (let i = from; i <= to; i++) {
                // Получение заголовка
                let defaultTitle = defaultNodes[i].innerHTML.trim().replace(/&nbsp;/g, ' ');

                // Получение относительной ссылки на статью
                let defualtLink = defaultNodes[i].parentNode.href;

                // Итоговая ссылка с заголовком статьи
                let defaultArticle = `<a href='https://skillbox.ru${defualtLink}'>${defaultTitle}</a><br>\n`; //--------------------------------
                console.log('Обычная статья: ' + defaultTitle);

                // Запись статьи в файл
                fs.appendFileSync('./articles.html', defaultArticle, (err) => {
                    if (err) throw err;
                });
            }
        }

        getPinnedArticles(0);
        getDefaultArticles(0, 5);
        getPinnedArticles(1);
        getDefaultArticles(6, 11);

        page++;

        if (page <= pagesNumber) {
            params.set('params[PAGE_NUM]', page);
        } else {
            console.log('Парсинг завершён.');
        }
    }

    setInterval(getArticles, parsingDelay);
}

paginator();
