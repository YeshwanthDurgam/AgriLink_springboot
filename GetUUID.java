import java.util.UUID;

public class GetUUID {
    public static void main(String[] args) {
        String[] emails = {
            "amit.patel@agrilink.com",
            "rajesh.kumar@agrilink.com", 
            "priya.sharma@agrilink.com"
        };
        for (String email : emails) {
            UUID uuid = UUID.nameUUIDFromBytes(email.getBytes());
            System.out.println(email + " -> " + uuid);
        }
    }
}
