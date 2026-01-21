import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class CreateSchemas {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://ep-square-hill-ahcj9c6a-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
        String user = "neondb_owner";
        String password = "npg_bVWzNYFB23tP";
        
        String[] schemas = {
            "auth_schema",
            "user_schema", 
            "farm_schema",
            "marketplace_schema",
            "order_schema",
            "iot_schema",
            "notification_schema"
        };
        
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            System.out.println("Connected to Neon database!");
            
            try (Statement stmt = conn.createStatement()) {
                for (String schema : schemas) {
                    String sql = "CREATE SCHEMA IF NOT EXISTS " + schema;
                    stmt.execute(sql);
                    System.out.println("Created schema: " + schema);
                }
                
                // Clean up old data from public schema
                System.out.println("\nCleaning up old data from public schema...");
                try {
                    stmt.execute("DROP TABLE IF EXISTS public.user_roles CASCADE");
                    stmt.execute("DROP TABLE IF EXISTS public.users CASCADE");
                    stmt.execute("DROP TABLE IF EXISTS public.roles CASCADE");
                    stmt.execute("DROP TABLE IF EXISTS public.flyway_schema_history CASCADE");
                    System.out.println("Cleaned up public schema.");
                } catch (Exception e) {
                    System.out.println("Note: " + e.getMessage());
                }
            }
            
            System.out.println("\nAll schemas created successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
