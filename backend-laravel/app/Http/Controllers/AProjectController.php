<?php

namespace App\Http\Controllers;

use App\Models\History;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Http\Request;

class AProjectController extends Controller
{
    public function show()
    {
        $user = JWTAuth::user();
        if ($user->nextcloudkey == "") {
            return response(['message' => 'Not authorized'], 401);
        }

        $this->saveHistory("View projects");

        $curl_projects = curl_init();
        curl_setopt($curl_projects, CURLOPT_URL, $user->nextcloudurl);
        curl_setopt($curl_projects, CURLOPT_CUSTOMREQUEST, "PROPFIND");
        curl_setopt($curl_projects, CURLOPT_POSTFIELDS,
            '<x0:propfind xmlns:x0="DAV:"><x0:prop><x0:getcontenttype/><x0:getetag/><x0:resourcetype/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/><x4:invite xmlns:x4="http://owncloud.org/ns"/><x5:allowed-sharing-modes xmlns:x5="http://calendarserver.org/ns/"/><x5:publish-url xmlns:x5="http://calendarserver.org/ns/"/><x6:calendar-order xmlns:x6="http://apple.com/ns/ical/"/><x6:calendar-color xmlns:x6="http://apple.com/ns/ical/"/><x5:getctag xmlns:x5="http://calendarserver.org/ns/"/><x1:calendar-description xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-timezone xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-component-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-data xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-resource-size xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:min-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-instances xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-attendees-per-instance xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-collation-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-free-busy-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-calendar-transp xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-default-calendar-URL xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x4:calendar-enabled xmlns:x4="http://owncloud.org/ns"/><x3:owner-displayname xmlns:x3="http://nextcloud.com/ns"/><x3:trash-bin-retention-duration xmlns:x3="http://nextcloud.com/ns"/><x3:deleted-at xmlns:x3="http://nextcloud.com/ns"/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/><x4:invite xmlns:x4="http://owncloud.org/ns"/><x5:allowed-sharing-modes xmlns:x5="http://calendarserver.org/ns/"/><x5:publish-url xmlns:x5="http://calendarserver.org/ns/"/><x6:calendar-order xmlns:x6="http://apple.com/ns/ical/"/><x6:calendar-color xmlns:x6="http://apple.com/ns/ical/"/><x5:getctag xmlns:x5="http://calendarserver.org/ns/"/><x1:calendar-description xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-timezone xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-component-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-data xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-resource-size xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:min-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-instances xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-attendees-per-instance xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-collation-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-free-busy-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-calendar-transp xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-default-calendar-URL xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x4:calendar-enabled xmlns:x4="http://owncloud.org/ns"/><x3:owner-displayname xmlns:x3="http://nextcloud.com/ns"/><x3:trash-bin-retention-duration xmlns:x3="http://nextcloud.com/ns"/><x3:deleted-at xmlns:x3="http://nextcloud.com/ns"/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/><x4:invite xmlns:x4="http://owncloud.org/ns"/><x5:allowed-sharing-modes xmlns:x5="http://calendarserver.org/ns/"/><x5:publish-url xmlns:x5="http://calendarserver.org/ns/"/><x6:calendar-order xmlns:x6="http://apple.com/ns/ical/"/><x6:calendar-color xmlns:x6="http://apple.com/ns/ical/"/><x5:getctag xmlns:x5="http://calendarserver.org/ns/"/><x1:calendar-description xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-timezone xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-component-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-data xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-resource-size xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:min-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-instances xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-attendees-per-instance xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-collation-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-free-busy-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-calendar-transp xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-default-calendar-URL xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x4:calendar-enabled xmlns:x4="http://owncloud.org/ns"/><x3:owner-displayname xmlns:x3="http://nextcloud.com/ns"/><x3:trash-bin-retention-duration xmlns:x3="http://nextcloud.com/ns"/><x3:deleted-at xmlns:x3="http://nextcloud.com/ns"/><x5:source xmlns:x5="http://calendarserver.org/ns/"/><x6:refreshrate xmlns:x6="http://apple.com/ns/ical/"/><x5:subscribed-strip-todos xmlns:x5="http://calendarserver.org/ns/"/><x5:subscribed-strip-alarms xmlns:x5="http://calendarserver.org/ns/"/><x5:subscribed-strip-attachments xmlns:x5="http://calendarserver.org/ns/"/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/><x4:invite xmlns:x4="http://owncloud.org/ns"/><x5:allowed-sharing-modes xmlns:x5="http://calendarserver.org/ns/"/><x5:publish-url xmlns:x5="http://calendarserver.org/ns/"/><x6:calendar-order xmlns:x6="http://apple.com/ns/ical/"/><x6:calendar-color xmlns:x6="http://apple.com/ns/ical/"/><x5:getctag xmlns:x5="http://calendarserver.org/ns/"/><x1:calendar-description xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-timezone xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-component-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-calendar-data xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-resource-size xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:min-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-date-time xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-instances xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:max-attendees-per-instance xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:supported-collation-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:calendar-free-busy-set xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-calendar-transp xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x1:schedule-default-calendar-URL xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x4:calendar-enabled xmlns:x4="http://owncloud.org/ns"/><x3:owner-displayname xmlns:x3="http://nextcloud.com/ns"/><x3:trash-bin-retention-duration xmlns:x3="http://nextcloud.com/ns"/><x3:deleted-at xmlns:x3="http://nextcloud.com/ns"/><x1:calendar-availability xmlns:x1="urn:ietf:params:xml:ns:caldav"/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/><x0:displayname/><x0:owner/><x0:resourcetype/><x0:sync-token/><x0:current-user-privilege-set/></x0:prop></x0:propfind>');
        curl_setopt($curl_projects, CURLOPT_RETURNTRANSFER, true);

        $headers = [
            'Content-Type: application/xml',
            'Depth: 1',
            'Authorization: Bearer ' . $user->nextcloudkey,
        ];

        curl_setopt($curl_projects, CURLOPT_HTTPHEADER, $headers);

        $server_output = curl_exec($curl_projects);
        curl_close($curl_projects);
        return response($server_output, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }
    
    public function create(Request $request)
    {
        $validator = $this->getValidationFactory()
            ->make($request->all(), [
                'name' => 'required|string|min:3|max:20',
            ]);
        if ($validator->fails()) {
            return response(['error' => $validator->errors(), 'Validaton Error'], 400);
        }

        $user = JWTAuth::user();
        if ($user->nextcloudkey == "") {
            return response(['message' => 'Not authorized'], 401);
        }

        $this->saveHistory("Create project " . $request->name);

        $curl_task = curl_init();
        curl_setopt($curl_task, CURLOPT_URL, $user->nextcloudurl . $request->name );
        curl_setopt($curl_task, CURLOPT_CUSTOMREQUEST, "MKCOL");
        curl_setopt($curl_task, CURLOPT_POSTFIELDS, '<x0:mkcol xmlns:x0="DAV:"><x0:set><x0:prop><x0:resourcetype><x0:collection/><x1:calendar xmlns:x1="urn:ietf:params:xml:ns:caldav"/></x0:resourcetype><x0:displayname>'. $request->name. '</x0:displayname><x6:calendar-color xmlns:x6="http://apple.com/ns/ical/">#0082c9</x6:calendar-color><x4:calendar-enabled xmlns:x4="http://owncloud.org/ns">1</x4:calendar-enabled><x1:supported-calendar-component-set xmlns:x1="urn:ietf:params:xml:ns:caldav"><x1:comp name="VTODO"/></x1:supported-calendar-component-set></x0:prop></x0:set></x0:mkcol>');
        curl_setopt($curl_task, CURLOPT_RETURNTRANSFER, true);

        $headers = [
            'Content-Type: application/xml',
            'Depth: 1',
            'Authorization: Bearer ' . $user->nextcloudkey,
        ];

        curl_setopt($curl_task, CURLOPT_HTTPHEADER, $headers);

        $server_output = curl_exec($curl_task);
        curl_close($curl_task);
      
        return response($server_output, 200, [
            'Content-Type' => 'application/xml',
        ]);

    }

    public function destroy($id)
    {
     
        $user = JWTAuth::user();
        if ($user->nextcloudkey == "") {
            return response(['message' => 'Not authorized'], 401);
        }

        $this->saveHistory("Remove project " . $id);


        $curl_task = curl_init();
        curl_setopt($curl_task, CURLOPT_URL, $user->nextcloudurl . $id );
        curl_setopt($curl_task, CURLOPT_CUSTOMREQUEST, "DELETE");
        curl_setopt($curl_task, CURLOPT_RETURNTRANSFER, true);

        $headers = [
            'Content-Type: application/xml',
            'Depth: 1',
            'Authorization: Bearer ' . $user->nextcloudkey,
        ];

        curl_setopt($curl_task, CURLOPT_HTTPHEADER, $headers);

        $server_output = curl_exec($curl_task);
        curl_close($curl_task);
      
        return response($server_output, 204, [
            'Content-Type' => 'application/xml',
        ]);
    }


    public function saveHistory($log_message)
    {
        $user = JWTAuth::user();
        $user_id = $user->id;
        $history = new History();
        $history->user_id_fk = $user_id;
        $history->log_message = $log_message;
        $history->save();
    }
}
