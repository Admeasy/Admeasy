package in.admeasy.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GoogleAuth.class);
        setTheme(R.style.AppTheme_NoActionBarLaunch);
        super.onCreate(savedInstanceState);
    }
}
