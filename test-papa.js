const Papa = require('papaparse');
const csvString = '\uFEFFID,氏名,役職,部門,性別,年齢,上司ID\n1,山田 太郎,店長,営業,,,\n2,佐藤 花子,副店長,営業,,,1';

Papa.parse(csvString, {
    header: true,
    complete: (res) => {
        console.log(res.data);
    }
});
