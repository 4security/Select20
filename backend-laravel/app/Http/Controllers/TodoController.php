<?php

namespace App\Http\Controllers;

use App\Models\History;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class TodoController extends Controller
{

    public function show(Request $request)
    {

        $validator = $this->getValidationFactory()
            ->make($request->all(), [
                'list' => 'required|string|min:2|max:20',
            ]);
        if ($validator->fails()) {
            return response(['error' => $validator->errors(), 'Validaton Error'], 400);
        }

        $user = JWTAuth::user();
        if ($user->nextcloudkey == "") {
            return response(['message' => 'Not authorized'], 401);
        }

        # $this->saveHistory("View " . $request->list);

        $curl_tasks = curl_init();
        curl_setopt($curl_tasks, CURLOPT_URL, $user->nextcloudurl . $request->list);
        curl_setopt($curl_tasks, CURLOPT_CUSTOMREQUEST, "REPORT");
        curl_setopt(
            $curl_tasks,
            CURLOPT_POSTFIELDS,
            '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag />    <c:calendar-data />  </d:prop>  <c:filter>    <c:comp-filter name="VCALENDAR">      <c:comp-filter name="VTODO">        <c:prop-filter name="STATUS">          <c:text-match negate-condition="yes">COMPLETED</c:text-match>        </c:prop-filter>      </c:comp-filter>    </c:comp-filter>  </c:filter></c:calendar-query>'
        );
        curl_setopt($curl_tasks, CURLOPT_RETURNTRANSFER, true);

        $headers = [
            'Content-Type: application/xml',
            'Depth: 1',
            'Authorization: Bearer ' . $user->nextcloudkey,
        ];

        curl_setopt($curl_tasks, CURLOPT_HTTPHEADER, $headers);

        $server_output = curl_exec($curl_tasks);
        header('Content-Type: text/xml');
        curl_close($curl_tasks);
        return response($server_output, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    public function getRandomString($n)
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';

        for ($i = 0; $i < $n; $i++) {
            $index = rand(0, strlen($characters) - 1);
            $randomString .= $characters[$index];
        }

        return $randomString;
    }

    public function update(Request $request)
    {
        $validator = $this->getValidationFactory()
            ->make($request->all(), [
                'list' => 'required|string|min:2|max:20',
                'ics' => 'required|string|min:10|max:50',
                'calendar' => 'required|string|min:2|max:20',
                'ical' => 'required|string|min:20|max:10000',
            ]);
        if ($validator->fails()) {
            return response(['error' => $validator->errors(), 'Validation Error'], 400);
        }

        $user = JWTAuth::user();
        if ($user->nextcloudkey == "") {
            return response(['message' => 'Not authorized'], 401);
        }

        $this->saveHistory("Update or save " . $user->nextcloudurl . $request->list . "/" . $request->ics . ".ics", $request->ical);

        $curl_task = curl_init();

        curl_setopt($curl_task, CURLOPT_URL, $user->nextcloudurl . $request->list . "/" . $request->ics . ".ics");
        curl_setopt($curl_task, CURLOPT_CUSTOMREQUEST, "PUT");
        curl_setopt($curl_task, CURLOPT_POSTFIELDS, $request->ical);
        curl_setopt($curl_task, CURLOPT_RETURNTRANSFER, true);

        $headers = [
            'Content-Type: application/xml',
            'Depth: 1',
            'Authorization: Bearer ' . $user->nextcloudkey,
        ];

        curl_setopt($curl_task, CURLOPT_HTTPHEADER, $headers);

        $server_output = curl_exec($curl_task);
        curl_close($curl_task);

        $curl_taskCal = curl_init();

        $server_output_cal = "";
        if ($request->calendar != "none") {
            curl_setopt($curl_taskCal, CURLOPT_URL, $user->nextcloudurl . $request->calendar . "/" . $request->ics . "-calendar.ics");
            curl_setopt($curl_taskCal, CURLOPT_CUSTOMREQUEST, "PUT");

            curl_setopt($curl_taskCal, CURLOPT_RETURNTRANSFER, true);

            preg_match('/SUMMARY:(?<summary>.*)\n/', $request->ical, $summaryMatches, PREG_OFFSET_CAPTURE);
            preg_match('/DUE:(?<start>.*)\n/', $request->ical, $startMatches, PREG_OFFSET_CAPTURE);
            preg_match('/;ENDCAL=(?<end>[^;|\n]*)/', $request->ical, $endMatches, PREG_OFFSET_CAPTURE);

            $event = 'BEGIN:VCALENDAR
PRODID:-//s20
CALSCALE:GREGORIAN
VERSION:2.0
BEGIN:VEVENT
CREATED:20220130T054207Z
DTSTAMP:20220130T054252Z
LAST-MODIFIED:20220130T054252Z
SEQUENCE:2
UID:' . $request->ics . '-calendar
DTSTART;TZID=Europe/Berlin:' . $startMatches["start"][0] . '
DTEND;TZID=Europe/Berlin:' . $endMatches["end"][0] . '
STATUS:CONFIRMED
SUMMARY:' . $summaryMatches["summary"][0] . '
DESCRIPTION:
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER;RELATED=START:-PT15M
END:VALARM
END:VEVENT
BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
END:VCALENDAR';

            $headers = [
                'Content-Type: application/xml',
                'Depth: 1',
                'Authorization: Bearer ' . $user->nextcloudkey,
            ];

            curl_setopt($curl_taskCal, CURLOPT_POSTFIELDS, $event);
            curl_setopt($curl_taskCal, CURLOPT_HTTPHEADER, $headers);
            $server_output_cal = curl_exec($curl_taskCal);
            curl_close($curl_taskCal);
        }
        return response($server_output . $server_output_cal, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    public function saveHistory($log_message, $todo = "")
    {
        $user = JWTAuth::user();
        $user_id = $user->id;
        $history = new History();
        $history->user_id_fk = $user_id;
        $history->log_message = $log_message;
        $history->todo = $todo;
        $history->save();
    }
}
