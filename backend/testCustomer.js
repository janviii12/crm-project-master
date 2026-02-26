import axios from 'axios';
import FormData from 'form-data';

async function testCustomerCreation() {
  try {
    console.log('Starting test...');
    const form = new FormData();
    form.append('name', 'Test User');
    form.append('email', 'test@example.com');
    form.append('phone', '1234567890');
    form.append('type', 'Company Registration');
    form.append('file', Buffer.from('test content'), 'test.pdf');

    console.log('Form data prepared, making request...');
    const response = await axios.post('http://localhost:5000/api/customers/create', form, {
      headers: form.getHeaders()
    });

    console.log('Success:', response.data);
  } catch (err) {
    console.log('Error details:', err);
    if (err.response) {
      console.log('Response status:', err.response.status);
      console.log('Response data:', err.response.data);
    } else {
      console.log('No response received');
    }
  }
}

testCustomerCreation();
