import db from './db.js';

export const CSV_SEPERATOR = '\t';

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

export async function* generateCSV(start, end, devices) {
  yield 'sep=' + CSV_SEPERATOR + '\n';
  yield ['Device', 'Timestamp', 'Event Type', 'Tab ID', 'Url', 'Title'].join(
    CSV_SEPERATOR
  ) + '\n';
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
      [start.toISOString(), end.toISOString(), devices]
    );
    for await (const row of stream) {
      row[1] = formatDate(row[1]);
      yield row.join(CSV_SEPERATOR) + '\n';
    }
  } finally {
    if (stream) stream.close();
    if (conn) conn.release();
  }
}
