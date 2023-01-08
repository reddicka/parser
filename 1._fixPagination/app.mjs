/* 
    Парсер сайта "Журналист"
*/

import axios from 'axios';
import fs from 'fs';
import jsdom from 'jsdom';
const { JSDOM } = jsdom;

const pagesNumber = 16;
const baseLink = 'https://jrnlst.ru/?page=';
let page = 0;
// Стартовое значение задержки следующего запроса (увеличивается с каждым запросом, чтобы не отправлять их слишком часто)
let parsingTimeout = 3000;

function paginator() {
    function getArticles() {
        let link = baseLink + page; // Создание ссылки на страницу со статьями
        console.log('Запрос статей по ссылке: ' + link); //

        axios.get(link).then((response) => {
            let currentPage = response.data; // Запись полученного результата
            const dom = new JSDOM(currentPage); // Инициализация библиотеки jsdom для разбора полученных HTML-данных как в браузере

            // Определение количества ссылок на странице, потому что оно у них не всегда фиксированное. Понадобится в цикле ниже
            let linksLength = dom.window.document
                .getElementById('block-views-articles-latest-on-front-block')
                .getElementsByClassName('view-content')[0]
                .getElementsByClassName('flex-teaser-square').length;

            // Перебор и запись всех статей на выбранной странице
            for (let i = 0; i < linksLength; i++) {
                // Получение относительных ссылок на статьи (так в оригинале)
                let relLink = dom.window.document
                    .getElementById('block-views-articles-latest-on-front-block')
                    .getElementsByClassName('view-content')[0]
                    .getElementsByClassName('flex-teaser-square')
                    [i].getElementsByClassName('views-field views-field-title')[0]
                    .getElementsByTagName('a')[0].outerHTML;

                // Превращение ссылок в абсолютные
                let article = relLink.replace('/', 'https://jrnlst.ru/') + '<br>' + '\n';

                // Уведомление о найденных статьях
                console.log('На странице ' + 'найдена статья: ' + article);

                // Запись результата в файл
                fs.appendFileSync('./articles.html', article, (err) => {
                    if (err) throw err;
                });
            }

            // Уведомление об окончании работы парсера
            if (page > pagesNumber) {
                console.log('Парсинг завершён.');
            }
        });

        // Увеличение номера страницы для сбора данных, чтобы следующий запрос был на более старую страницу
        page++;
    }

    setInterval(getArticles, parsingTimeout);
}

paginator();
