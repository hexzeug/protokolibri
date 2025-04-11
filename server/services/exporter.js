import db from './db.js';

export const CSV_SEPERATOR = '\t';
const SEARCH_INDEX_PARAM = 'protokolibri-search';

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  const SS = String(date.getSeconds()).padStart(2, '0');
  const sss = String(date.getMilliseconds()).padStart(3, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${MM}:${SS}.${sss}`;
};

const transformRow = (row) => {
  row[1] = formatDate(row[1]);
  row.push(null);
  const url = URL.parse(row[4]);
  if (url !== null && url.searchParams.has(SEARCH_INDEX_PARAM)) {
    row[6] = url.searchParams.get(SEARCH_INDEX_PARAM);
    url.searchParams.delete(SEARCH_INDEX_PARAM);
    row[4] = url.href;
  }
};

async function* yieldDataRows(start, end, devices) {
  let conn;
  let stream;
  try {
    conn = await db.getConnection();
    stream = conn.queryStream(
      {
        rowsAsArray: true,
        sql: `
          SELECT device_name_id, event_timestamp, event_type, tab_id, tab_url, tab_title
          FROM tab_event
          WHERE event_timestamp BETWEEN ? AND ? ${
            devices ? 'AND device_name_id IN (?)' : ''
          }
          ORDER BY device_name_id ASC, event_timestamp ASC
        `,
      },
      [start, end, devices]
    );
    for await (const row of stream) {
      transformRow(row);
      yield row;
    }
  } finally {
    if (stream) stream.close();
    if (conn) conn.release();
  }
}

export async function* generateCSV(start, end, devices) {
  yield [
    'Device',
    'Timestamp',
    'Event Type',
    'Tab ID',
    'Url',
    'Title',
    'Search Result Index',
  ].join(CSV_SEPERATOR) + '\n';
  try {
    for await (const row of yieldDataRows(start, end, devices)) {
      yield row.join(CSV_SEPERATOR) + '\n';
    }
  } catch (e) {
    console.error(`error while exporting ${start} ${end} ${devices}`, e);
    yield 'Internal error';
  }
}
